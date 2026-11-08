/** Ảnh ứng viên của các điểm mới, không sửa catalog trước khi kiểm trực quan. */
import fs from 'node:fs';
import path from 'node:path';
import { wikiPage, usableImages, getBytes, getJson } from './build-catalog.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, '.logs/refinement-place-photos');
const output = path.join(root, 'docs/research/place-photo-candidates-20261106.json');
fs.mkdirSync(dir, { recursive: true });
const manifest = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : {};
const before = JSON.parse(fs.readFileSync(path.join(root, '.logs/refinement-catalog-before.json'), 'utf8'));
const oldIds = new Set(before.flatMap(entry => entry.data.places.map(place => place.id)));
const replace = new Set(['ninh-binh-co-do-hoa-lu', 'buon-ma-thuot-buon-don', 'phu-quoc-hon-thom', 'phu-quoc-ganh-dau']);
for (const entry of before) {
  const dest = JSON.parse(fs.readFileSync(path.join(root, 'backend/src/main/resources/catalog', entry.file), 'utf8'));
  for (const place of dest.places.filter(place => !oldIds.has(place.id) && (!place.photos.length || replace.has(place.id)))) {
    if (manifest[place.id]) continue;
    try {
      const page = place.wikipediaTitle ? await wikiPage(place.wikipediaTitle) : null;
      const search = await getJson('https://commons.wikimedia.org/w/api.php', { action: 'query', generator: 'search', gsrsearch: `"${place.name}" filetype:bitmap`, gsrnamespace: '6', gsrlimit: '12' });
      const names = [...new Set([...(page?.images ?? []), ...Object.values(search.query?.pages ?? {}).map(file => file.title)])];
      const images = [...new Map((await usableImages(names)).map(image => [image.source, image])).values()].slice(0, 4);
      const candidates = [];
      for (const [index, image] of images.entries()) {
        const file = `ref-${place.id}-${index + 1}.jpg`;
        fs.writeFileSync(path.join(dir, file), await getBytes(image.url));
        candidates.push({ ...image, file });
      }
      manifest[place.id] = { destination: dest.id, title: place.name, candidates, approved: [] };
      console.log(`${place.id}: ${candidates.length}`);
    } catch (error) { manifest[place.id] = { destination: dest.id, title: place.name, candidates: [], approved: [], error: String(error.message) }; }
    fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}
