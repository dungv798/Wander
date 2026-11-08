/** Kiểm nhanh hợp đồng catalog trước khi build Java; giữ bản chụp cũ để phát hiện mất dữ liệu. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'backend/src/main/resources/catalog');
const constants = fs.readFileSync(path.join(root, 'backend/src/main/java/com/wander/catalog/domain/constant/CatalogConstants.java'), 'utf8');
const limits = Object.fromEntries([...constants.matchAll(/public static final int (\w+) = (\d+);/g)].map(match => [match[1], Number(match[2])]));
const fields = { id: 'PLACE_ID_MAX_LENGTH', name: 'NAME_MAX_LENGTH', area: 'AREA_MAX_LENGTH', hook: 'HOOK_MAX_LENGTH', bestLabel: 'BEST_LABEL_MAX_LENGTH', duration: 'DURATION_MAX_LENGTH', difficulty: 'DIFFICULTY_MAX_LENGTH', verdictReason: 'REASON_MAX_LENGTH', slotReason: 'REASON_MAX_LENGTH' };
const before = JSON.parse(fs.readFileSync(path.join(root, '.logs/refinement-catalog-before.json'), 'utf8'));
const rows = [];
for (const entry of before) {
  const dest = JSON.parse(fs.readFileSync(path.join(dir, entry.file), 'utf8'));
  for (const old of entry.data.places) {
    const now = dest.places.find(place => place.id === old.id);
    assert.ok(now, `Mất thẻ cũ ${old.id}`);
    assert.deepEqual({ ...now, photos: old.photos }, old, `Đổi nội dung cũ ${old.id}`);
    assert.deepEqual(now.photos.slice(0, old.photos.length), old.photos, `Mất/đổi thứ tự ảnh cũ ${old.id}`);
  }
  assert.deepEqual(dest.coverPhoto, entry.data.coverPhoto);
  assert.deepEqual(dest.moments.slice(0, entry.data.moments.length), entry.data.moments);
  for (const old of entry.data.guide) {
    const now = dest.guide.find(guide => guide.id === old.id);
    assert.deepEqual({ ...now, items: now.items.slice(0, old.items.length) }, old);
  }
  const ids = new Set(dest.places.map(place => place.id));
  assert.equal(ids.size, dest.places.length);
  assert.ok(dest.moments.length <= limits.MAX_MOMENTS_PER_DESTINATION);
  for (const place of dest.places) {
    for (const [field, limit] of Object.entries(fields)) assert.ok(place[field]?.trim() && place[field].length <= limits[limit], `${place.id}.${field}: ${place[field]?.length}/${limits[limit]}`);
    assert.ok(place.photos.length <= limits.MAX_PHOTOS_PER_PLACE);
    assert.ok(Number.isFinite(place.lat) && Number.isFinite(place.lon));
  }
  for (const guide of dest.guide) for (const item of guide.items) if (item.placeId) assert.ok(ids.has(item.placeId), `Link hỏng ${dest.id}:${item.placeId}`);
  const allPhotos = [...dest.places.flatMap(place => place.photos), ...dest.moments, ...(dest.coverPhoto ? [dest.coverPhoto] : [])];
  for (const photo of allPhotos) {
    if (photo.url) assert.equal(new URL(photo.url).hostname, 'images.unsplash.com');
    else assert.ok(fs.existsSync(path.join(dir, 'photos', photo.file)), `Thiếu ảnh ${photo.file}`);
    assert.ok(photo.author && photo.license && photo.sourceUrl.startsWith('https://'));
  }
  rows.push({ destination: dest.id, before: entry.data.places.length, places: dest.places.length, food: dest.places.filter(place => place.category === 'am').length, photos: dest.places.reduce((sum, place) => sum + place.photos.length, 0), moments: dest.moments.length, photoGaps: dest.places.filter(place => !place.photos.length).map(place => place.id) });
}
const pois = fs.readdirSync(path.join(dir, 'poi')).filter(file => file.endsWith('.json')).map(file => JSON.parse(fs.readFileSync(path.join(dir, 'poi', file), 'utf8')));
const report = { preserved: 'PASS', contractPreflight: 'PASS', destinations: rows.length, before: rows.reduce((sum, row) => sum + row.before, 0), places: rows.reduce((sum, row) => sum + row.places, 0), beforePhotos: before.reduce((sum, entry) => sum + entry.data.places.reduce((count, place) => count + place.photos.length, 0), 0), foods: rows.reduce((sum, row) => sum + row.food, 0), photos: rows.reduce((sum, row) => sum + row.photos, 0), moments: rows.reduce((sum, row) => sum + row.moments, 0), poiDestinations: pois.length, pois: pois.reduce((sum, batch) => sum + batch.pois.length, 0), rows };
const output = process.argv.find(arg => arg.startsWith('--out='))?.slice(6) ?? 'docs/research/catalog-enrichment-audit-20261106.json';
fs.writeFileSync(path.join(root, output), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, rows: undefined }));
