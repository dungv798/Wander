import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { listKeys, signRequest, uploadMissing } from './upload-photos.mjs';

const EMPTY = crypto.createHash('sha256').update('').digest('hex');
// Credentials and date from the AWS documentation examples (not secrets).
const AWS = {
  accessKey: 'AKIAIOSFODNN7EXAMPLE', secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1', amzDate: '20130524T000000Z',
};

test('signing matches the AWS Signature V4 documentation vectors (GET object with Range header)', () => {
  const { signature, authorization } = signRequest({
    ...AWS, method: 'GET', canonicalUri: '/test.txt', payloadHash: EMPTY,
    headers: { host: 'examplebucket.s3.amazonaws.com', range: 'bytes=0-9', 'x-amz-content-sha256': EMPTY, 'x-amz-date': AWS.amzDate },
  });
  assert.equal(signature, 'f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
  assert.equal(authorization, 'AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request,'
    + 'SignedHeaders=host;range;x-amz-content-sha256;x-amz-date,Signature=f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41');
});

test('signing matches the AWS vectors with query strings (GET ?lifecycle and list with max-keys/prefix)', () => {
  const headers = { host: 'examplebucket.s3.amazonaws.com', 'x-amz-content-sha256': EMPTY, 'x-amz-date': AWS.amzDate };
  const lifecycle = signRequest({ ...AWS, method: 'GET', canonicalUri: '/', canonicalQuery: 'lifecycle=', headers, payloadHash: EMPTY });
  assert.equal(lifecycle.signature, 'fea454ca298b7da1c68078a5d1bdbfbbe0d65c699e0f91ac7a200a0136783543');
  const list = signRequest({ ...AWS, method: 'GET', canonicalUri: '/', canonicalQuery: 'max-keys=2&prefix=J', headers, payloadHash: EMPTY });
  assert.equal(list.signature, '34b48302e7b5fa45bde8084f4b7868a86f0a534bc59db6670ed5711ef69dc6f7');
});

/** In-memory S3 stand-in: path-style bucket, ListObjectsV2 with 2 keys per page, PUT that records the headers it received. */
async function startFakeS3(bucket, initialKeys = []) {
  const objects = new Map(initialKeys.map(key => [key, { body: Buffer.alloc(0), headers: {} }]));
  const requests = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    requests.push({ method: req.method, path: url.pathname, authorization: req.headers.authorization, contentSha: req.headers['x-amz-content-sha256'] });
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      if (!req.headers.authorization?.startsWith('AWS4-HMAC-SHA256 ')) { res.writeHead(403).end('no signature'); return; }
      if (req.method === 'GET' && url.pathname === `/${bucket}`) {
        const keys = [...objects.keys()].sort();
        const start = Number(url.searchParams.get('continuation-token') ?? 0);
        const page = keys.slice(start, start + 2);
        const more = start + 2 < keys.length;
        res.writeHead(200).end(`<ListBucketResult>${page.map(k => `<Contents><Key>${k}</Key></Contents>`).join('')}`
          + `<IsTruncated>${more}</IsTruncated>${more ? `<NextContinuationToken>${start + 2}</NextContinuationToken>` : ''}</ListBucketResult>`);
      } else if (req.method === 'PUT' && url.pathname.startsWith(`/${bucket}/`)) {
        const body = Buffer.concat(chunks);
        if (crypto.createHash('sha256').update(body).digest('hex') !== req.headers['x-amz-content-sha256']) { res.writeHead(400).end('bad payload hash'); return; }
        objects.set(decodeURIComponent(url.pathname.slice(bucket.length + 2)), { body, headers: req.headers });
        res.writeHead(200).end();
      } else {
        res.writeHead(404).end();
      }
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const config = { endpoint: new URL(`http://127.0.0.1:${server.address().port}`), bucket, accessKey: 'k', secretKey: 's', region: 'auto' };
  return { config, objects, requests, close: () => new Promise(resolve => server.close(resolve)) };
}

test('listKeys follows continuation tokens across pages', async () => {
  const s3 = await startFakeS3('b', ['a.webp', 'b.webp', 'c.webp', 'd.webp', 'e.webp']);
  try {
    assert.deepEqual([...await listKeys(s3.config)].sort(), ['a.webp', 'b.webp', 'c.webp', 'd.webp', 'e.webp']);
  } finally { await s3.close(); }
});

test('uploadMissing uploads only missing .webp files with image/webp and immutable cache headers; a second run uploads nothing', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wander-upload-'));
  const s3 = await startFakeS3('wander-photos', ['already-w480-aaaaaaaaaa.webp']);
  try {
    for (const name of ['already-w480-aaaaaaaaaa.webp', 'new-w480-bbbbbbbbbb.webp', 'new-w1280-cccccccccc.webp', 'readme.txt']) fs.writeFileSync(path.join(dir, name), name);
    const logs = [];

    const dry = await uploadMissing({ ...s3.config, bucket: 'wander-photos' }, dir, { dryRun: true, log: line => logs.push(line) });
    assert.deepEqual(dry, { uploaded: 0, failed: 0 });
    assert.equal(s3.objects.size, 1, 'dry run must not upload');

    const first = await uploadMissing(s3.config, dir, { log: line => logs.push(line) });
    assert.deepEqual(first, { uploaded: 2, failed: 0 });
    assert.deepEqual([...s3.objects.keys()].sort(), ['already-w480-aaaaaaaaaa.webp', 'new-w1280-cccccccccc.webp', 'new-w480-bbbbbbbbbb.webp']);
    const stored = s3.objects.get('new-w480-bbbbbbbbbb.webp');
    assert.equal(stored.headers['content-type'], 'image/webp');
    assert.equal(stored.headers['cache-control'], 'public, max-age=31536000, immutable');
    assert.equal(stored.body.toString(), 'new-w480-bbbbbbbbbb.webp');
    assert.equal(s3.objects.get('already-w480-aaaaaaaaaa.webp').body.length, 0, 'existing key is not overwritten');

    const puts = s3.requests.filter(r => r.method === 'PUT').length;
    const second = await uploadMissing(s3.config, dir, { log: line => logs.push(line) });
    assert.deepEqual(second, { uploaded: 0, failed: 0 });
    assert.equal(s3.requests.filter(r => r.method === 'PUT').length, puts, 'second run sends no PUT');
    assert.ok(s3.requests.every(r => r.authorization.startsWith('AWS4-HMAC-SHA256 Credential=k/')), 'every request is signed');
    assert.ok(logs.every(line => !line.includes('"secretKey"')), 'logs carry counts only');
  } finally {
    await s3.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a failing PUT is reported, not swallowed', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wander-upload-'));
  const s3 = await startFakeS3('wander-photos');
  try {
    fs.writeFileSync(path.join(dir, 'x-w480-dddddddddd.webp'), 'x');
    const result = await uploadMissing({ ...s3.config, bucket: 'wander-photos' }, dir, { log: () => {} });
    assert.deepEqual(result, { uploaded: 1, failed: 0 });
    // Wrong bucket on PUT => the fake answers 404 => the script must count a failure.
    const wrong = await startFakeS3('other');
    try {
      const bad = await uploadMissing({ ...wrong.config, bucket: 'other' }, dir, { log: () => {} });
      assert.equal(bad.uploaded, 1, 'sanity: matching bucket works');
      const failing = { ...wrong.config, bucket: 'other' };
      wrong.objects.clear();
      const originalFetch = globalThis.fetch;
      globalThis.fetch = async (url, init) => (init?.method === 'PUT' ? new Response('boom', { status: 500 }) : originalFetch(url, init));
      try {
        const result500 = await uploadMissing(failing, dir, { log: () => {} });
        assert.deepEqual(result500, { uploaded: 0, failed: 1 });
      } finally { globalThis.fetch = originalFetch; }
    } finally { await wrong.close(); }
  } finally {
    await s3.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
