#!/usr/bin/env node
/**
 * Uploads the optimized catalog photos to an S3-compatible bucket (Cloudflare R2, MinIO, AWS S3), idempotently.
 *
 * - Lists the bucket once (ListObjectsV2) and uploads only the keys that are missing. File names carry a hash of their content
 *   (see optimize-photos.mjs), so "key exists" means "same bytes" and re-running is safe and cheap.
 * - Sets `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable` on every object.
 * - Keys are the bare file names (flat bucket), matching how the backend builds URLs: `<WANDER_PHOTO_BASE_URL>/<file>`.
 * - Credentials come from the environment only; nothing is read from files and nothing is printed except counts and key names.
 *
 * Environment:
 *   S3_ENDPOINT           e.g. https://<account-id>.r2.cloudflarestorage.com  (no bucket in the URL; path-style addressing)
 *   S3_BUCKET             bucket name
 *   S3_ACCESS_KEY_ID      access key id
 *   S3_SECRET_ACCESS_KEY  secret access key
 *   S3_REGION             optional, default "auto" (R2); use the real region for AWS S3
 *
 * Usage: node tools/catalog/upload-photos.mjs [--dir <photos dir>] [--dry-run]
 *
 * The request signing (AWS Signature V4) is implemented here with node:crypto to avoid a heavy SDK dependency; it is checked against
 * the official AWS test vector in upload-photos.test.mjs.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DEFAULT_DIR = path.join(ROOT, 'backend/src/main/resources/catalog/photos');
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const CONTENT_TYPE = 'image/webp';
const SERVICE = 's3';
const PARALLEL = 6;
const EMPTY_SHA256 = crypto.createHash('sha256').update('').digest('hex');

/** Reads required environment variables or exits with a message naming the missing ones (never their values). */
function readConfig() {
  const names = ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'];
  const missing = names.filter(name => !process.env[name]);
  if (missing.length > 0) {
    console.error(`Missing environment variables: ${missing.join(', ')} (see docs/operations/photos.md)`);
    process.exit(2);
  }
  const endpoint = new URL(process.env.S3_ENDPOINT);
  if (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(endpoint.hostname)) {
    console.error('S3_ENDPOINT must be https (plain http is only accepted for localhost testing).');
    process.exit(2);
  }
  return {
    endpoint, bucket: process.env.S3_BUCKET, accessKey: process.env.S3_ACCESS_KEY_ID,
    secretKey: process.env.S3_SECRET_ACCESS_KEY, region: process.env.S3_REGION || 'auto',
  };
}

const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const encode = value => encodeURIComponent(value).replace(/[!'()*]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/**
 * AWS Signature Version 4 for one request. Pure (no clock, no network) so it can be checked against the published AWS test vectors.
 * `headers` must already contain every header to sign (lower-case names), including host, x-amz-content-sha256 and x-amz-date.
 */
export function signRequest({ method, canonicalUri, canonicalQuery = '', headers, payloadHash, accessKey, secretKey, region, amzDate }) {
  const dateStamp = amzDate.slice(0, 8);
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map(n => `${n}:${headers[n]}\n`).join('');
  const canonicalRequest = [method, canonicalUri, canonicalQuery, canonicalHeaders, names.join(';'), payloadHash].join('\n');
  const scope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), region), SERVICE), 'aws4_request');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope},SignedHeaders=${names.join(';')},Signature=${signature}`;
  return { signature, authorization };
}

/** Signs and sends one S3 request (path-style: /<bucket>/<key>). `config.now` can inject a clock in tests. */
export async function s3Request(config, { method, key = '', query = {}, body = null, headers = {} }) {
  const amzDate = (config.now?.() ?? new Date()).toISOString().replace(/[:-]|\.\d{3}/g, '');
  const canonicalUri = `/${[config.bucket, ...(key ? key.split('/') : [])].map(encode).join('/')}`;
  const canonicalQuery = Object.keys(query).sort().map(k => `${encode(k)}=${encode(query[k])}`).join('&');
  const payloadHash = body ? sha256(body) : EMPTY_SHA256;
  const signedHeaders = {
    host: config.endpoint.host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate,
    ...Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v).trim()])),
  };
  const { authorization } = signRequest({
    method, canonicalUri, canonicalQuery, headers: signedHeaders, payloadHash,
    accessKey: config.accessKey, secretKey: config.secretKey, region: config.region, amzDate,
  });
  const url = `${config.endpoint.origin}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ''}`;
  const response = await fetch(url, { method, body, headers: { ...signedHeaders, authorization } });
  return { status: response.status, text: await response.text() };
}

/** All keys currently in the bucket (follows ListObjectsV2 continuation tokens). */
export async function listKeys(config) {
  const keys = new Set();
  let token = null;
  do {
    const query = { 'list-type': '2', ...(token ? { 'continuation-token': token } : {}) };
    const { status, text } = await s3Request(config, { method: 'GET', query });
    if (status !== 200) throw new Error(`ListObjectsV2 failed with HTTP ${status}: ${text.slice(0, 200)}`);
    for (const match of text.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.add(match[1]);
    token = /<IsTruncated>true<\/IsTruncated>/.test(text) ? /<NextContinuationToken>([^<]+)<\/NextContinuationToken>/.exec(text)?.[1] ?? null : null;
  } while (token);
  return keys;
}

/** Runs async work over items with bounded parallelism; collects failures instead of stopping. */
async function mapLimit(items, limit, work) {
  let next = 0;
  const failures = [];
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      try { await work(item); } catch (error) { failures.push(`${item}: ${error.message}`); }
    }
  }));
  return failures;
}

/** Uploads the .webp files of `dir` that the bucket does not have yet; returns counts. */
export async function uploadMissing(config, dir, { dryRun = false, log = console.log } = {}) {
  const files = fs.readdirSync(dir).filter(name => name.endsWith('.webp')).sort();
  const existing = await listKeys(config);
  const missing = files.filter(name => !existing.has(name));
  log(JSON.stringify({ files: files.length, alreadyInBucket: files.length - missing.length, toUpload: missing.length, dryRun }));
  if (dryRun || missing.length === 0) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  const failures = await mapLimit(missing, PARALLEL, async name => {
    const body = fs.readFileSync(path.join(dir, name));
    const { status, text } = await s3Request(config, {
      method: 'PUT', key: name, body, headers: { 'content-type': CONTENT_TYPE, 'cache-control': CACHE_CONTROL },
    });
    if (status !== 200) throw new Error(`HTTP ${status} ${text.slice(0, 120)}`);
    uploaded += 1;
  });
  log(JSON.stringify({ uploaded, failed: failures.length }));
  if (failures.length > 0) console.error(failures.slice(0, 10).join('\n'));
  return { uploaded, failed: failures.length };
}

/** Command-line entry point. */
async function main() {
  const args = process.argv.slice(2);
  const dirIndex = args.indexOf('--dir');
  const dir = dirIndex >= 0 ? path.resolve(args[dirIndex + 1]) : DEFAULT_DIR;
  const result = await uploadMissing(readConfig(), dir, { dryRun: args.includes('--dry-run') });
  if (result.failed > 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) await main();
