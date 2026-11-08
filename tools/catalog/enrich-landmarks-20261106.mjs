/** Bổ sung chỉ-append: giữ nguyên dữ liệu/ảnh cũ, ghi tiến độ từng ứng viên để có thể chạy tiếp. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildPlace } from './build-catalog.mjs';
import { landmarkRegions } from './enrichment-landmarks-20261106.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const catalogDir = path.join(root, 'backend/src/main/resources/catalog');
const reportFile = path.join(root, 'docs/research/enrichment-landmarks-20261106.json');
const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, 'utf8')) : {};
const selected = process.argv.find(a => a.startsWith('--dest='))?.slice(7);
for (const [dest, entries] of Object.entries(landmarkRegions)) {
  if (selected && dest !== selected) continue;
  const file = path.join(catalogDir, `${dest}.json`);
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8'));
  const seed = (await import(pathToFileURL(path.join(import.meta.dirname, 'seeds', `${dest}.mjs`)))).default;
  const ref = { ...catalog.references[0], dest: catalog.name, radiusKm: seed.radiusKm ?? 100 };
  for (const [slug, wiki, cat, hook] of entries) {
    const id = `${dest}-${slug}`;
    if (catalog.places.some(place => place.id === id || place.wikipediaTitle === wiki)) { console.log(`= ${id}`); continue; }
    if (report[id] && !process.argv.includes('--retry')) continue;
    try {
      const point = await buildPlace({ id, wiki, cat, area: catalog.name, hook, months: [], duration: cat === 'leo' ? 'Theo tuyến và lịch đoàn' : 'Chưa có dữ liệu', difficulty: cat === 'leo' ? 'Theo tuyến đã xác nhận' : 'Chưa xác định', highlights: [], verdict: 'worth', verdictReason: 'Gợi ý biên tập để cân nhắc theo sở thích của bạn.', slots: cat === 'leo' ? ['sang'] : [], slotReason: 'Chưa xác minh thời gian phù hợp; kiểm tra thời tiết và đơn vị quản lý.', tips: cat === 'leo' ? ['Tọa độ là mốc địa danh, không phải đầu tuyến đi bộ.', 'Chốt tuyến, thời lượng, giấy phép và lịch đoàn với guide trước khi xếp ngày.'] : ['Xác nhận tình trạng tiếp cận, giờ hoạt động và giá tại nguồn địa phương.', 'Xin phép khi chụp người hoặc vào không gian riêng.'], keepPhotos: [1] }, ref);
      report[id] = { destination: dest, status: point ? 'coordinate-resolved' : 'unresolved', researchedAt: '2026-11-06', wikipediaTitle: point?.wikipediaTitle ?? null };
      if (point) { catalog.places.push(point); fs.writeFileSync(file, `${JSON.stringify(catalog, null, 2)}\n`); }
    } catch (error) { report[id] = { destination: dest, status: 'error', error: String(error.message), researchedAt: '2026-11-06' }; console.log(`! ${id}: ${error.message}`); }
    fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  }
}
