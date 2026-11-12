// Nhập địa điểm từ OpenStreetMap theo danh sách biên tập tay (DR-033, D-A). CHỈ THÊM; không sửa/xóa địa điểm có sẵn.
//   node tools/catalog/import-osm-places.mjs --dest=ha-giang
// Nguồn: tools/catalog/data/osm-additions/<dest>.json (người duyệt chọn từ tools/catalog/data/osm-candidates/<dest>.json) → catalog/<dest>.json.
// Tên và tọa độ lấy từ OSM (ODbL); mô tả ngắn chỉ nêu dữ kiện (khu vực, nguồn), KHÔNG viết lời khuyên khẳng định.
// Vị trí = OSM_UNVERIFIED; trạng thái ghi ở tools/catalog/data/osm-additions/<dest>.json và nơi chưa chắc vị trí không được đưa vào lịch mẫu.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const DEST = arg('dest', '');
const UNKNOWN = 'Chưa rõ';
const catalogPath = path.join(ROOT, 'backend/src/main/resources/catalog', `${DEST}.json`);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const specs = JSON.parse(fs.readFileSync(path.join(here, 'osm-additions', `${DEST}.json`), 'utf8'));
const candidates = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/catalog/data/osm-candidates', `${DEST}.json`), 'utf8')).places;

const season = catalog.guide.find((g) => g.layout === 'MONTHS');
const months = season?.bestMonths ?? [];

/** Nhãn tháng nên đi từ danh sách tháng (khớp bộ dựng): "Tháng 9–11" hoặc "Quanh năm". */
function monthLabel(list) {
  const m = [...new Set(list)].sort((a, b) => a - b);
  if (!m.length) return UNKNOWN;
  if (m.length === 12) return 'Quanh năm';
  const runs = [];
  for (const x of m) {
    const last = runs[runs.length - 1];
    if (last && x === last[1] + 1) last[1] = x;
    else runs.push([x, x]);
  }
  return `Tháng ${runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')}`;
}

const have = new Set(catalog.places.map((p) => p.id));
const provenance = { dest: DEST, source: 'OpenStreetMap contributors (ODbL)', importedAt: new Date().toISOString().slice(0, 10), places: {} };
let added = 0;
for (const spec of specs) {
  if (have.has(spec.id)) { console.log(`  = ${spec.id}: đã có, bỏ qua`); continue; }
  const hit = candidates.find((c) => c.name === spec.osm);
  if (!hit) { console.log(`  ✗ ${spec.id}: không thấy "${spec.osm}" trong ứng viên OSM`); continue; }
  catalog.places.push({
    id: spec.id, name: spec.name, category: spec.cat, area: spec.area, hook: `Địa điểm ghi trên OpenStreetMap, khu vực ${spec.area}.`,
    summary: '', lat: hit.lat, lon: hit.lon, bestMonths: months, bestLabel: monthLabel(months), duration: UNKNOWN, difficulty: UNKNOWN, highlights: [],
    verdict: 'ifconv', verdictReason: 'Thông tin tham khảo từ OpenStreetMap; Wander chưa đánh giá nơi này.', bestSlots: [], slotReason: 'Chưa có thông tin buổi nên đi.', tips: [],
    photos: [], wikipediaTitle: null,
  });
  provenance.places[spec.id] = { osm: hit.osm, osmName: hit.name, kind: hit.kind, position: 'OSM_UNVERIFIED', status: 'UNVERIFIED', note: spec.note ?? '' };
  added += 1;
  console.log(`  ✓ ${spec.id}: ${spec.name} (${hit.osm}, ${hit.lat}, ${hit.lon})`);
}
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
const outDir = path.join(ROOT, 'tools/catalog/data/osm-additions');
fs.mkdirSync(outDir, { recursive: true });
const provPath = path.join(outDir, `${DEST}.json`);
const old = fs.existsSync(provPath) ? JSON.parse(fs.readFileSync(provPath, 'utf8')) : { places: {} };
fs.writeFileSync(provPath, JSON.stringify({ ...provenance, places: { ...old.places, ...provenance.places } }, null, 1));
console.log(`Đã thêm ${added} địa điểm vào catalog/${DEST}.json (ảnh: photos rỗng, chờ photo-pipeline)`);
