// Quán ăn/cà phê/điểm nghỉ từ OpenStreetMap cho một điểm đến (DR-033): snapshot Overpass → batch POI của backend.
//   node tools/catalog/poi-pipeline.mjs --dest=hoi-an
// Dữ liệu chưa xác minh hiện trạng/giờ mở cửa (ODbL, ghi công OSM). Không ảnh, không rating, không suy diễn giờ. Bán kính tối đa 15 km của backend:
// mỗi điểm đến một tâm (một mốc tham chiếu của catalog); Hà Giang: --ref=dong-van nên chỉ phủ vùng quanh Đồng Văn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPoi, distanceMeters } from './build-poi.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=')[1];
const DEST = arg('dest', '');
const OVERPASS = arg('endpoint', 'https://overpass-api.de/api/interpreter');
const UA = 'WanderPOI/0.2 (learning project; contact binkuteqn289@gmail.com)';
const RADIUS_M = Number(arg('radius', '15000'));
if (!Number.isFinite(RADIUS_M) || RADIUS_M <= 0 || RADIUS_M > 15_000) throw new Error('Bán kính phải lớn hơn 0 và không vượt 15000m');
const CATEGORY_RE = '^(restaurant|cafe|fast_food|bar|pub|ice_cream)$';

if (!DEST) throw new Error('Thiếu --dest=<mã điểm đến>');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'backend/src/main/resources/catalog', `${DEST}.json`), 'utf8'));
const ref = catalog.references[0];
// Tâm POI phải TRÙNG một mốc tham chiếu của catalog (backend kiểm): mặc định mốc đầu; Hà Giang dùng --ref=dong-van (cụm du lịch chính).
const chosen = catalog.references.find((r) => r.id === arg('ref', ref.id)) ?? ref;
const center = [chosen.lat, chosen.lon];
const query = `[out:json][timeout:90];nwr["amenity"~"${CATEGORY_RE}"](around:${RADIUS_M},${center[0]},${center[1]});out center tags;`;

const getMethod = process.argv.includes('--get');
const res = await fetch(getMethod ? `${OVERPASS}?data=${encodeURIComponent(query)}` : OVERPASS, { method: getMethod ? 'GET' : 'POST', headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' }, body: getMethod ? undefined : `data=${encodeURIComponent(query)}`, signal: AbortSignal.timeout(120000) });
if (!res.ok) throw new Error(`Overpass ${res.status}`);
const raw = await res.json();
const pois = (raw.elements ?? []).map((e) => ({
  id: `${e.type}/${e.id}`, sourceUrl: `https://www.openstreetmap.org/${e.type}/${e.id}`, name: e.tags?.name ?? e.tags?.['name:vi'] ?? null, category: e.tags?.amenity,
  lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, coordinateKind: e.type === 'node' ? 'point' : 'polygon-center', tags: e.tags ?? {},
})).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));
const snapshot = { fetchedAt: new Date().toISOString(), osmTimestamp: raw.osm3s?.timestamp_osm_base, bbox: `around:${RADIUS_M},${center.join(',')}`, attribution: '© OpenStreetMap contributors', license: 'ODbL-1.0', licenseUrl: 'https://www.openstreetmap.org/copyright', pois };
fs.mkdirSync(path.join(ROOT, 'docs/research/poi-snapshots'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs/research/poi-snapshots', `${DEST}.json`), JSON.stringify(snapshot));
// Overpass có thể trả polygon cắt vòng tròn nhưng tâm nằm ngoài; giữ snapshot gốc, chỉ nhập tâm nằm trong phạm vi đã khai báo.
const bounded = { ...snapshot, pois: snapshot.pois.filter(poi => distanceMeters(center, [poi.lat, poi.lon]) <= RADIUS_M) };
const result = buildPoi(bounded, { destinationId: DEST, center, radiusM: RADIUS_M });
fs.writeFileSync(path.join(ROOT, 'backend/src/main/resources/catalog/poi', `${DEST}.json`), `${JSON.stringify(result, null, 2)}\n`);
console.log(`${DEST}: ${JSON.stringify(result.statistics.afterByKind)} (có tên ${result.statistics.named}/${result.statistics.before})`);
