/** Bảng ảnh để kiểm trực quan; giữ nguyên tệp ảnh nguồn. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
const root = path.resolve(import.meta.dirname, '../..');
const foodFile = path.join(root, 'docs/research/food-photo-candidates-20261106.json');
const foods = JSON.parse(fs.readFileSync(foodFile, 'utf8'));
let candidates = Object.values(foods).flatMap(topic => topic.candidates.map((photo, index) => ({ ...photo, label: `${topic.title} · ${index + 1}`, imagePath: path.join(root, '.logs/refinement-food-photos', photo.file) })));
const extraOnly = process.argv.includes('--food-extras');
const placeCandidates = process.argv.includes('--place-candidates');
if (extraOnly) candidates = candidates.filter(photo => photo.file.startsWith('food-extra-'));
if (placeCandidates) {
  const places = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/place-photo-candidates-20261106.json'), 'utf8'));
  candidates = Object.entries(places).flatMap(([id, place]) => place.candidates.map((photo, index) => ({ ...photo, label: `${id} · ${index + 1}`, imagePath: path.join(root, '.logs/refinement-place-photos', photo.file) })));
}
const base = JSON.parse(fs.readFileSync(path.join(root, '.logs/refinement-catalog-before.json'), 'utf8'));
const ids = new Set(base.flatMap(entry => entry.data.places.map(place => place.id)));
for (const entry of extraOnly || placeCandidates ? [] : base) {
  const dest = JSON.parse(fs.readFileSync(path.join(root, 'backend/src/main/resources/catalog', entry.file), 'utf8'));
  for (const place of dest.places.filter(place => !ids.has(place.id))) {
    for (const photo of place.photos) candidates.push({ ...photo, title: place.wikipediaTitle, label: place.id, imagePath: path.join(root, 'backend/src/main/resources/catalog/photos', photo.file) });
  }
}
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1300 }, deviceScaleFactor: 1 });
  for (let offset = 0; offset < candidates.length; offset += 16) {
    const prefix = extraOnly ? 'food-extra' : placeCandidates ? 'place' : '';
    const htmlFile = path.join(root, `.logs/refinement-${prefix ? `${prefix}-` : ''}contact-${offset / 16 + 1}.html`);
    const cards = candidates.slice(offset, offset + 16).map(photo => `<article><img src="${pathToFileURL(photo.imagePath).href}"><strong>${escape(photo.label)}</strong><p>${escape(photo.title)}</p></article>`).join('');
    fs.writeFileSync(htmlFile, `<!doctype html><meta charset="utf-8"><style>body{margin:12px;font:16px Arial;background:#edf3ef}main{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}article{padding:10px;background:white;overflow:hidden}img{width:100%;height:205px;object-fit:contain}strong{display:block}p{margin:5px 0;font-size:12px;overflow-wrap:anywhere}</style><main>${cards}</main>`);
    await page.goto(pathToFileURL(htmlFile).href);
    await page.screenshot({ path: htmlFile.replace('.html', '.png'), fullPage: true });
    console.log(htmlFile.replace('.html', '.png'));
  }
} finally { await browser.close(); }
