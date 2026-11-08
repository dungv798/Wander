/** Tuyển ảnh món ăn tách khỏi nhập catalog: chỉ nhập các số ảnh đã xem và ghi vào approved. */
import fs from 'node:fs';
import path from 'node:path';
import { foodRegions } from './enrichment-foods-20261106.mjs';
import { wikiPage, usableImages, getBytes, getJson } from './build-catalog.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, '.logs/refinement-food-photos');
const manifestFile = path.join(root, 'docs/research/food-photo-candidates-20261106.json');
fs.mkdirSync(dir, { recursive: true });
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const topics = [...new Map(Object.values(foodRegions).flatMap(region => region.foods).map(food => [food[2], food])).values()];
for (const [slug, , title] of topics) {
  if (manifest[title] && !process.argv.includes('--review-more')) continue;
  try {
    const page = await wikiPage(title);
    const category = await getJson('https://commons.wikimedia.org/w/api.php', { action: 'query', list: 'categorymembers', cmtitle: `Category:${title}`, cmtype: 'file', cmlimit: '30' });
    const titles = [...new Set([...(page?.lead ? [`File:${page.lead}`] : []), ...(page?.images ?? []), ...(category.query?.categorymembers ?? []).map(file => file.title)])];
    const images = [...new Map((await usableImages(titles)).map(image => [image.source, image])).values()].slice(0, 3);
    const candidates = [];
    for (const [index, image] of images.entries()) {
      const file = `food-${slug}-${index + 1}.jpg`;
      fs.writeFileSync(path.join(dir, file), await getBytes(image.url));
      candidates.push({ ...image, file });
    }
    manifest[title] = { title, wikipediaTitle: page?.title ?? null, candidates, approved: [] };
    console.log(`${title}: ${candidates.length}`);
  } catch (error) { manifest[title] = { title, candidates: [], approved: [], error: String(error.message) }; console.log(`! ${title}: ${error.message}`); }
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
}
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const cards = Object.values(manifest).flatMap(topic => topic.candidates.map((photo, index) => `<article><img src="refinement-food-photos/${encodeURIComponent(photo.file)}"><strong>${escape(topic.title)} · ${index + 1}</strong><p>${escape(photo.title)}</p><p>${escape(photo.license)} · ${escape(photo.author)}</p></article>`));
fs.writeFileSync(path.join(root, '.logs/refinement-food-contact.html'), `<!doctype html><meta charset="utf-8"><title>Food photo review</title><style>body{margin:20px;background:#eaf0ed;font:16px Arial}main{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}article{background:white;padding:12px;overflow:hidden}img{width:100%;height:190px;object-fit:contain}strong{display:block}p{font-size:12px;overflow-wrap:anywhere}</style><main>${cards.join('')}</main>`);
