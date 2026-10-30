import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = path.resolve('web/dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const files = new Set();
/** Theo import tĩnh đệ quy, cộng cả modulepreload; không cộng chunk chỉ tải qua import động. */
function visit(relative) {
  const file = path.resolve(dist, relative.replace(/^\//, ''));
  if (files.has(file)) return;
  files.add(file);
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/(?:\bimport\s*(?:[^;]*?\sfrom\s*)?|\bexport\s*[^;]*?\sfrom\s*)["']([^"']+\.js)["']/g)) {
    const imported = path.resolve(path.dirname(file), match[1]);
    visit(path.relative(dist, imported));
  }
}
for (const match of html.matchAll(/(?:src|href)="([^"]+\.js)"/g)) visit(match[1]);
const rows = [...files].map(file => ({ file: path.relative(dist, file), gzip: gzipSync(fs.readFileSync(file)).length }));
const bytes = rows.reduce((s, row) => s + row.gzip, 0);
const result = { limitBytes: 170_000, bytes, kilobytes: bytes / 1000, files: rows, pass: bytes <= 170_000 };
fs.writeFileSync('.logs/ux-video/initial-js.json', JSON.stringify(result, null, 2));
console.log(`${result.pass ? 'PASS' : 'FAIL'} initial JS + static imports + preload: ${result.kilobytes.toFixed(2)} KB gzip / 170 KB`);
if (!result.pass) process.exitCode = 1;
