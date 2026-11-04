import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const EARTH_RADIUS_M = 6_371_000;
const DEDUPE_RADIUS_M = 50;
/** Cấu hình mặc định (Đà Lạt); điểm đến khác truyền `config` riêng (DR-033). Bán kính tối đa của backend là 15 km. */
export const DEFAULT_POI_CONFIG = { destinationId: 'da-lat', center: [11.9404, 108.4583], radiusM: 15_000 };
const KINDS = ['food', 'cafe', 'fast_food', 'bar', 'other'];
const KIND_MAP = { restaurant: 'food', cafe: 'cafe', fast_food: 'fast_food', bar: 'bar', pub: 'bar' };
const INPUT = new URL('../../docs/research/da-lat-poi-trial/pois.json', import.meta.url);
const OUTPUT = new URL('../../backend/src/main/resources/catalog/poi/da-lat.json', import.meta.url);

/** Tính khoảng cách chim bay bằng mét, không phải khoảng cách đi đường. */
export function distanceMeters(from, to) {
  const radians = degrees => degrees * Math.PI / 180;
  const deltaLat = radians(to[0] - from[0]);
  const deltaLon = radians(to[1] - from[1]);
  const chord = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.asin(Math.sqrt(Math.min(1, chord)));
}

/** Chuẩn hóa tên để so trùng, giữ dấu và các từ có thể phân biệt chi nhánh. */
function normalizedName(name) {
  return name.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('vi');
}

/** Kiểm tra nguồn và tọa độ trước khi dựng tài nguyên; dữ liệu sai làm lệnh thất bại. */
function requireSource(poi, seen, config) {
  if (!/^(node|way|relation)\/[1-9]\d*$/u.test(poi.id) || seen.has(poi.id)) throw new Error(`Nguồn OSM sai hoặc lặp: ${poi.id}`);
  seen.add(poi.id);
  const coords = [poi.lat, poi.lon];
  if (!coords.every(Number.isFinite) || Math.abs(poi.lat) > 90 || Math.abs(poi.lon) > 180) throw new Error(`Tọa độ sai: ${poi.id}`);
  if (distanceMeters(config.center, coords) > config.radiusM) throw new Error(`Ngoài bán kính điểm đến: ${poi.id}`);
  if (!['point', 'polygon-center'].includes(poi.coordinateKind)) throw new Error(`Kiểu tọa độ sai: ${poi.id}`);
}

/** Đếm loại đã chuẩn hóa cho từng giai đoạn nhập. */
function counts(pois, kindOf) {
  return Object.fromEntries(KINDS.map(kind => [kind, pois.filter(poi => kindOf(poi) === kind).length]));
}

/** Giữ nguồn gộp cùng toàn bộ tag để review lại, không chuyển dữ kiện sang nguồn chính. */
function sourceReference(poi) {
  const [osmType, id] = poi.id.split('/');
  return { osmType, osmId: Number(id), sourceUrl: `https://www.openstreetmap.org/${poi.id}`,
    center: [poi.lat, poi.lon], tags: Object.fromEntries(Object.entries(poi.tags).sort(([a], [b]) => a.localeCompare(b, 'en'))) };
}

/** Dựng bản ghi từ nguồn được giữ; không gán ảnh, rating hoặc giờ tự suy diễn. */
function toRecord(poi, merged, snapshot, config) {
  const ref = sourceReference(poi);
  const tags = poi.tags;
  const addressTags = Object.keys(tags).filter(key => key.startsWith('addr:') && tags[key]?.trim()).sort();
  const address = addressTags.length ? addressTags.map(key => tags[key]).join(', ') : null;
  const raw = tags.opening_hours?.trim() ? tags.opening_hours : null;
  const facts = {
    osmType: ref.osmType, osmId: ref.osmId, coordinateKind: poi.coordinateKind === 'point' ? 'point' : 'center',
    name: poi.name.trim(), kind: KIND_MAP[poi.category] ?? 'other', center: ref.center,
    address, openingHoursRaw: raw, phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null, wikidataId: tags.wikidata || null,
  };
  const evidence = { sourceKind: 'OSM', sourceUrl: ref.sourceUrl, snapshotAt: snapshot.fetchedAt,
    osmTimestamp: snapshot.osmTimestamp, license: snapshot.license, licenseUrl: snapshot.licenseUrl, attribution: snapshot.attribution };
  return { id: `poi-${config.destinationId}-${ref.osmType}-${ref.osmId}`, ...facts,
    openingHoursStatus: raw === null ? 'UNKNOWN' : 'RAW', verificationStatus: 'SNAPSHOT_UNVERIFIED',
    provenance: Object.fromEntries(Object.entries(facts).filter(([, value]) => value !== null).map(([field]) => [field, { ...evidence }])),
    mergedFrom: merged.map(sourceReference) };
}

/** Dựng batch cố định từ snapshot; tie-break theo khóa nguồn, không phụ thuộc thứ tự đầu vào. */
export function buildPoi(snapshot, config = DEFAULT_POI_CONFIG) {
  if (!snapshot.fetchedAt || !snapshot.osmTimestamp || snapshot.license !== 'ODbL-1.0' || !snapshot.attribution || !snapshot.licenseUrl) {
    throw new Error('Snapshot thiếu ngày hoặc giấy phép/ghi công');
  }
  const seen = new Set();
  const named = snapshot.pois.filter(poi => typeof poi.name === 'string' && poi.name.trim());
  named.forEach(poi => requireSource(poi, seen, config));
  named.sort((a, b) => Object.keys(b.tags).length - Object.keys(a.tags).length || a.id.localeCompare(b.id, 'en'));
  const retained = [];
  for (const poi of named) {
    const duplicate = retained.find(entry => normalizedName(entry.poi.name) === normalizedName(poi.name)
      && distanceMeters([entry.poi.lat, entry.poi.lon], [poi.lat, poi.lon]) <= DEDUPE_RADIUS_M);
    if (duplicate) duplicate.merged.push(poi);
    else retained.push({ poi, merged: [] });
  }
  const pois = retained.map(({ poi, merged }) => toRecord(poi, merged, snapshot, config)).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  return {
    destinationId: config.destinationId, center: config.center, radiusM: config.radiusM,
    snapshotAt: snapshot.fetchedAt, osmTimestamp: snapshot.osmTimestamp, sourceBbox: snapshot.bbox,
    notice: 'Dữ liệu snapshot OSM chưa xác minh hiện trạng hoặc giờ hoạt động; không phải danh sách Discover đã duyệt.',
    statistics: { before: snapshot.pois.length, named: named.length, removedUnnamed: snapshot.pois.length - named.length,
      mergedDuplicates: named.length - pois.length, after: pois.length,
      beforeByKind: counts(snapshot.pois, poi => KIND_MAP[poi.category] ?? 'other'),
      namedByKind: counts(named, poi => KIND_MAP[poi.category] ?? 'other'), afterByKind: counts(pois, poi => poi.kind) },
    pois,
  };
}

/** Chạy nhập ngoại tuyến, tạo byte giống nhau khi đầu vào không đổi. */
async function main() {
  const result = buildPoi(JSON.parse(await readFile(INPUT, 'utf8')));
  await mkdir(dirname(fileURLToPath(OUTPUT)), { recursive: true });
  await writeFile(OUTPUT, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  process.stdout.write(`${JSON.stringify(result.statistics)}\n${result.notice}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
