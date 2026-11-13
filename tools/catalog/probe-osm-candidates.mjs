// Khảo sát ứng viên địa điểm từ OpenStreetMap quanh một điểm đến (DR-033, D-A). CHỈ ĐỌC và ghi tệp nghiên cứu, không sửa catalog.
//   node tools/catalog/probe-osm-candidates.mjs --dest=hoi-an
// Đầu ra: tools/catalog/data/osm-candidates/<dest>.json (tên, loại OSM, tọa độ, nhãn nguồn); in số lượng và nơi trùng catalog hiện có.
// Giấy phép dữ liệu: ODbL (OpenStreetMap contributors). Mọi dòng là THAM KHẢO: vị trí lấy từ OSM, chưa kiểm độc lập.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const DEST = arg('dest', '');
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'WanderCatalog/0.1 (learning project; contact https://github.com/dungv798/Wander)';
/** Bán kính tìm quanh điểm tham chiếu (km) theo từng điểm đến: Hà Giang và Tà Xùa rộng vì địa hình thưa. */
const RADIUS_KM = { 'hoi-an': 14, 'vinh-hy': 22, 'ta-xua': 30, 'ha-giang': 70, 'sa-pa': 80 };
const MIN_NAME = 3;
const KM = 1000;

const catalogPath = path.join(ROOT, 'backend/src/main/resources/catalog', `${DEST}.json`);
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const ref = catalog.references?.[0];
if (!ref) throw new Error(`catalog ${DEST} không có điểm tham chiếu`);
const radius = (RADIUS_KM[DEST] ?? 20) * KM;

const query = `[out:json][timeout:60];(
  nwr["tourism"~"^(attraction|viewpoint|museum|gallery|zoo|theme_park)$"]["name"](around:${radius},${ref.lat},${ref.lon});
  nwr["historic"]["name"](around:${radius},${ref.lat},${ref.lon});
  nwr["natural"~"^(peak|waterfall|beach|cave_entrance|hot_spring|bay)$"]["name"](around:${radius},${ref.lat},${ref.lon});
  nwr["leisure"~"^(park|nature_reserve)$"]["name"](around:${radius},${ref.lat},${ref.lon});
  nwr["amenity"="marketplace"]["name"](around:${radius},${ref.lat},${ref.lon});
);out center tags 400;`;

const res = await fetch(OVERPASS, { method: 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `data=${encodeURIComponent(query)}`, signal: AbortSignal.timeout(90000) });
if (!res.ok) throw new Error(`Overpass ${res.status}`);
const data = await res.json();

/** Bỏ dấu và ký tự không phải chữ để so tên trùng giữa OSM và catalog. */
const norm = (t) => String(t ?? '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const existing = new Set(catalog.places.map((p) => norm(p.name)));
const seen = new Set();
const rows = [];
for (const el of data.elements ?? []) {
  const name = el.tags?.['name:vi'] ?? el.tags?.name;
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!name || name.length < MIN_NAME || lat == null || lon == null) continue;
  const key = norm(name);
  if (seen.has(key)) continue;
  seen.add(key);
  const kind = el.tags.tourism ?? el.tags.historic ?? el.tags.natural ?? el.tags.leisure ?? el.tags.amenity;
  rows.push({ osm: `${el.type}/${el.id}`, name, kind, lat: +lat.toFixed(5), lon: +lon.toFixed(5), wikipedia: el.tags.wikipedia ?? null, wikidata: el.tags.wikidata ?? null, inCatalog: existing.has(key), verification: { position: 'OSM_UNVERIFIED', status: 'UNVERIFIED' } });
}
const out = path.join(ROOT, 'tools/catalog/data/osm-candidates', `${DEST}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ dest: DEST, source: 'OpenStreetMap contributors (ODbL), Overpass', fetchedAt: new Date().toISOString(), center: { lat: ref.lat, lon: ref.lon, radiusKm: radius / KM }, count: rows.length, places: rows }, null, 1));
console.log(`${DEST}: ${rows.length} ứng viên (${rows.filter((r) => r.inCatalog).length} trùng catalog, ${rows.filter((r) => r.wikipedia || r.wikidata).length} có wikipedia/wikidata) → ${path.relative(ROOT, out)}`);
