#!/usr/bin/env node
/**
 * Builds the web-ready catalog photos from the original images and rewrites the catalog JSON to point at them.
 *
 * For every photo referenced by backend/src/main/resources/catalog/**.json it writes two WebP variants
 * (480 px for lists/cards, 1280 px for detail views; never upscaled), re-encoded from the pixels so EXIF/GPS and every
 * other metadata block are dropped (EXIF orientation is applied first, so photos stay upright). Files are named
 * `<slug>-w<width>-<hash10>.webp` where hash10 is the SHA-256 of the output bytes, so a name changes exactly when its
 * bytes do and the files can be served with `Cache-Control: immutable`.
 *
 * In each catalog entry `file` becomes the largest variant and `thumbFile` the 480 px one; author, license, sourceUrl and
 * every other field are left untouched. Results are cached in tools/catalog/data/photo-manifest.json (keyed by the SHA-256
 * of the source), so re-running without changes writes nothing.
 *
 * Usage:
 *   node tools/catalog/optimize-photos.mjs [--src <dir>] [--out <dir>] [--dry-run] [--check]
 *
 *   --src       directory with the ORIGINAL images, named like the `file` values in the catalog JSON
 *               (default tools/catalog/photo-originals, git-ignored; see "Where the originals come from" below)
 *   --out       output directory (default backend/src/main/resources/catalog/photos)
 *   --dry-run   report what would change, write nothing
 *   --check     exit 1 if the catalog JSON or the output directory is out of date (for CI)
 *
 * Where the originals come from: each catalog entry keeps its `sourceUrl` (Wikimedia Commons, Flickr, Unsplash ...) with
 * author and license; the manifest records the SHA-256 of every original next to its sourceUrl so a download can be
 * verified. The original JPG/PNG files up to the cleanup are also in git history (tag `pre-portfolio-cleanup`).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(import.meta.dirname, '../..');
const CATALOG_DIR = path.join(ROOT, 'backend/src/main/resources/catalog');
const MANIFEST_FILE = path.join(ROOT, 'tools/catalog/data/photo-manifest.json');

/** Target widths, smallest first. A variant is never wider than the source. */
const WIDTHS = [480, 1280];
const WEBP = { quality: 78, effort: 5 };
const SETTINGS_VERSION = `w${WIDTHS.join('-')}-q${WEBP.quality}-e${WEBP.effort}-sharp`;
const HASH_LENGTH = 10;
const PARALLEL = 4;
const IMAGE_FILE = /\.(jpe?g|png|webp)$/i;
const ALREADY_OPTIMIZED = /-w\d+-[0-9a-f]{10}\.webp$/;

/** Reads `--name value` and `--flag` options. */
function parseArgs(argv) {
  const options = { src: path.join(ROOT, 'tools/catalog/photo-originals'), out: path.join(CATALOG_DIR, 'photos'), dryRun: false, check: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--src') options.src = path.resolve(argv[++i]);
    else if (arg === '--out') options.out = path.resolve(argv[++i]);
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--check') options.check = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

/** Catalog JSON files that can carry photos: destinations, POI and template files. */
function catalogJsonFiles() {
  const top = fs.readdirSync(CATALOG_DIR).filter(f => f.endsWith('.json')).map(f => path.join(CATALOG_DIR, f));
  const nested = ['poi', 'templates'].flatMap(dir => {
    const full = path.join(CATALOG_DIR, dir);
    return fs.existsSync(full) ? fs.readdirSync(full).filter(f => f.endsWith('.json')).map(f => path.join(full, f)) : [];
  });
  return [...top, ...nested];
}

/** Calls `visit` on every object that is a local photo entry (a `file` ending in an image extension). */
function forEachPhotoEntry(node, visit) {
  if (Array.isArray(node)) node.forEach(child => forEachPhotoEntry(child, visit));
  else if (node && typeof node === 'object') {
    if (typeof node.file === 'string' && IMAGE_FILE.test(node.file)) visit(node);
    Object.values(node).forEach(child => forEachPhotoEntry(child, visit));
  }
}

/** First `HASH_LENGTH` hex characters of the SHA-256 of a buffer. */
function hash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/** Encodes the source into the width variants and returns their bytes; metadata is not carried over. */
async function encodeVariants(sourceFile) {
  const meta = await sharp(sourceFile).metadata();
  // EXIF orientations 5-8 swap width and height once the image is rotated upright.
  const sourceWidth = (meta.orientation ?? 1) >= 5 ? meta.height : meta.width;
  const widths = [...new Set(WIDTHS.map(w => Math.min(w, sourceWidth)))].sort((a, b) => a - b);
  const variants = [];
  for (const width of widths) {
    const buffer = await sharp(sourceFile).rotate().resize({ width, withoutEnlargement: true }).webp(WEBP).toBuffer();
    variants.push({ width, buffer, digest: hash(buffer).slice(0, HASH_LENGTH) });
  }
  return { sourceWidth, variants };
}

/** Runs async work over items with bounded parallelism. */
async function mapLimit(items, limit, work) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index], index);
    }
  }));
  return results;
}

/** Loads the manifest or returns an empty one. */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_FILE)) return { settings: SETTINGS_VERSION, photos: {} };
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
  return manifest.settings === SETTINGS_VERSION ? manifest : { settings: SETTINGS_VERSION, photos: {} };
}

/** Stable JSON text: sorted keys so the manifest diff only shows real changes. */
function stableJson(value) {
  const sort = v => (Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v);
  return `${JSON.stringify(sort(value), null, 2)}\n`;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const files = catalogJsonFiles();
  const documents = new Map(files.map(file => [file, JSON.parse(fs.readFileSync(file, 'utf8'))]));

  /** Original file name -> the catalog entries that use it (with the first-seen provenance). */
  const entriesByOriginal = new Map();
  for (const doc of documents.values()) {
    forEachPhotoEntry(doc, entry => {
      if (ALREADY_OPTIMIZED.test(entry.file)) return;
      const list = entriesByOriginal.get(entry.file) ?? [];
      list.push(entry);
      entriesByOriginal.set(entry.file, list);
    });
  }
  const originals = [...entriesByOriginal.keys()].sort();
  const manifest = loadManifest();
  const stats = { originals: originals.length, encoded: 0, reused: 0, written: 0, missingSource: [] };

  if (!fs.existsSync(options.out) && !options.dryRun && !options.check) fs.mkdirSync(options.out, { recursive: true });

  await mapLimit(originals, PARALLEL, async original => {
    const sourcePath = path.join(options.src, original);
    const cached = manifest.photos[original];
    if (!fs.existsSync(sourcePath)) {
      if (cached && cached.variants.every(v => fs.existsSync(path.join(options.out, v.file)))) { stats.reused += 1; return; }
      stats.missingSource.push(original);
      return;
    }
    const sourceBytes = fs.readFileSync(sourcePath);
    const sourceSha = hash(sourceBytes);
    if (cached && cached.sourceSha256 === sourceSha && cached.variants.every(v => fs.existsSync(path.join(options.out, v.file)))) {
      stats.reused += 1;
      return;
    }
    const slug = original.replace(/\.[^.]+$/, '');
    const { sourceWidth, variants } = await encodeVariants(sourcePath);
    stats.encoded += 1;
    const described = variants.map(v => ({ width: v.width, file: `${slug}-w${v.width}-${v.digest}.webp`, bytes: v.buffer.length }));
    if (!options.dryRun && !options.check) {
      for (const [i, v] of variants.entries()) {
        const target = path.join(options.out, described[i].file);
        if (!fs.existsSync(target)) { fs.writeFileSync(target, v.buffer); stats.written += 1; }
      }
    }
    const sample = entriesByOriginal.get(original)[0];
    manifest.photos[original] = {
      sourceSha256: sourceSha, sourceBytes: sourceBytes.length, sourceWidth, sourceUrl: sample.sourceUrl ?? null,
      author: sample.author ?? null, license: sample.license ?? null, variants: described,
    };
  });

  if (stats.missingSource.length > 0) {
    console.error(`Missing source images in ${options.src}: ${stats.missingSource.length} (first: ${stats.missingSource.slice(0, 3).join(', ')})`);
    process.exitCode = 1;
    return;
  }

  /** Rewrite the catalog entries: `file` = largest variant, `thumbFile` = smallest when two exist. */
  let rewritten = 0;
  for (const [original, entries] of entriesByOriginal) {
    const { variants } = manifest.photos[original];
    const large = variants.at(-1).file;
    const thumb = variants.length > 1 ? variants[0].file : null;
    for (const entry of entries) {
      const rebuilt = {};
      for (const [key, value] of Object.entries(entry)) {
        if (key === 'thumbFile') continue;
        rebuilt[key] = key === 'file' ? large : value;
        if (key === 'file' && thumb) rebuilt.thumbFile = thumb;
      }
      for (const key of Object.keys(entry)) delete entry[key];
      Object.assign(entry, rebuilt);
      rewritten += 1;
    }
  }

  let changedDocuments = 0;
  for (const [file, doc] of documents) {
    const text = `${JSON.stringify(doc, null, 2)}\n`;
    if (text !== fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n')) {
      changedDocuments += 1;
      if (!options.dryRun && !options.check) fs.writeFileSync(file, text);
    }
  }

  const manifestText = stableJson(manifest);
  const manifestChanged = !fs.existsSync(MANIFEST_FILE) || fs.readFileSync(MANIFEST_FILE, 'utf8') !== manifestText;
  if (!options.dryRun && !options.check && manifestChanged) {
    fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
    fs.writeFileSync(MANIFEST_FILE, manifestText);
  }

  console.log(JSON.stringify({ ...stats, missingSource: undefined, entriesRewritten: rewritten, jsonFilesChanged: changedDocuments, manifestChanged }));
  if (options.check && (changedDocuments > 0 || manifestChanged || stats.encoded > 0)) {
    console.error('Catalog photos are out of date: run `node tools/catalog/optimize-photos.mjs`.');
    process.exitCode = 1;
  }
}

await main();
