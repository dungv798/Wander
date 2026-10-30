import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildPoi, distanceMeters } from './build-poi.mjs';

const metadata = {
  fetchedAt: '2026-10-29T02:34:26.802Z', osmTimestamp: '2026-10-29T02:23:30Z',
  bbox: '11.88,108.36,12.02,108.53', attribution: '© OpenStreetMap contributors',
  license: 'ODbL-1.0', licenseUrl: 'https://www.openstreetmap.org/copyright',
};

/** Tạo đối tượng nguồn tổng hợp, không cần truy cập mạng. */
function source(id, name, lat = 11.94, tags = {}, category = 'restaurant') {
  return { id, name, lat, lon: 108.44, category, coordinateKind: 'point',
    sourceUrl: `https://www.openstreetmap.org/${id}`, tags: { amenity: category, name, ...tags } };
}

test('bỏ tên trống, gộp tên Unicode giống trong 50 m và giữ nguồn nhiều tag', () => {
  const pois = [source('node/1', 'Quán A'.normalize('NFD')), source('node/2', ' QUÁN A ', 11.9401, { phone: '123' }),
    source('node/3', 'Quán A', 11.942), source('node/4', '  '), source('way/2', 'Khác')];
  const result = buildPoi({ ...metadata, pois });
  assert.equal(result.pois.length, 3);
  const kept = result.pois.find(p => p.osmId === 2 && p.osmType === 'node');
  assert.deepEqual(kept.mergedFrom.map(p => `${p.osmType}/${p.osmId}`), ['node/1']);
  assert.equal(result.statistics.removedUnnamed, 1);
  assert.equal(result.statistics.mergedDuplicates, 1);
  assert.equal(result.pois.filter(p => p.osmId === 2).length, 2);
  assert.deepEqual(buildPoi({ ...metadata, pois: [...pois].reverse() }), result);
});

test('không gộp tên khác, không gộp dây chuyền vượt 50 m từ nguồn được giữ', () => {
  const result = buildPoi({ ...metadata, pois: [source('node/1', 'A'),
    source('node/2', 'A', 11.9404), source('node/3', 'A', 11.9408), source('node/4', 'B')] });
  assert.equal(result.pois.length, 3);
  assert.ok(distanceMeters([11.94, 108.44], [11.9404, 108.44]) < 50);
  assert.ok(distanceMeters([11.94, 108.44], [11.9408, 108.44]) > 50);
});

test('giữ raw, unknown, contact, center, provenance và slug không đổi khi đổi tên', () => {
  const raw = ' Mo-Fr 08:00-12:00,13:00-22:00; PH off ';
  const poi = source('way/20', 'Cafe', 11.94, { opening_hours: raw, 'contact:phone': '123',
    'contact:website': 'https://example.test', 'addr:street': 'Đường A', wikidata: 'Q123' }, 'cafe');
  poi.coordinateKind = 'polygon-center';
  const built = buildPoi({ ...metadata, pois: [poi, source('node/21', 'Kem', 11.94, {}, 'ice_cream')] });
  const cafe = built.pois.find(p => p.osmId === 20);
  assert.equal(cafe.openingHoursRaw, raw);
  assert.equal(cafe.openingHoursStatus, 'RAW');
  assert.equal(cafe.coordinateKind, 'center');
  assert.deepEqual(cafe.center, [11.94, 108.44]);
  assert.equal(cafe.phone, '123');
  assert.equal(cafe.wikidataId, 'Q123');
  assert.equal(cafe.provenance.openingHoursRaw.snapshotAt, metadata.fetchedAt);
  assert.equal(cafe.provenance.openingHoursRaw.license, 'ODbL-1.0');
  assert.equal(cafe.provenance.openingHoursRaw.sourceKind, 'OSM');
  assert.equal(cafe.verificationStatus, 'SNAPSHOT_UNVERIFIED');
  const other = built.pois.find(p => p.osmId === 21);
  assert.equal(other.kind, 'other');
  assert.equal(other.openingHoursRaw, null);
  assert.equal(other.openingHoursStatus, 'UNKNOWN');
  assert.equal(buildPoi({ ...metadata, pois: [{ ...poi, name: 'Tên mới' }] }).pois[0].id, cafe.id);
  assert.equal('photos' in cafe || 'rating' in cafe, false);
});

test('từ chối tọa độ sai/ngoài điểm đến và nguồn lặp', () => {
  for (const lat of [NaN, 91, 20, null]) {
    assert.throws(() => buildPoi({ ...metadata, pois: [source('node/1', 'A', lat)] }));
  }
  assert.throws(() => buildPoi({ ...metadata, pois: [source('node/1', 'A'), source('node/1', 'B')] }));
});

test('snapshot thật dựng ổn định; mọi giá trị có nguồn, không nhập ảnh hoặc rating', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../../docs/research/da-lat-poi-trial/pois.json', import.meta.url)));
  const built = buildPoi(snapshot);
  assert.equal(built.statistics.before, 817);
  assert.equal(built.statistics.named, 631);
  assert.ok(built.pois.length < 631);
  assert.equal(new Set(built.pois.map(p => p.id)).size, built.pois.length);
  for (const poi of built.pois) {
    for (const field of ['osmType', 'osmId', 'coordinateKind', 'name', 'kind', 'center', 'address', 'openingHoursRaw', 'phone', 'website', 'wikidataId']) {
      if (poi[field] !== null) assert.ok(poi.provenance[field]?.sourceUrl);
    }
    assert.equal('photos' in poi || 'rating' in poi, false);
    assert.equal(poi.verificationStatus, 'SNAPSHOT_UNVERIFIED');
  }
  assert.deepEqual(buildPoi(snapshot), built);
  const resource = JSON.parse(await readFile(new URL('../../backend/src/main/resources/catalog/poi/da-lat.json', import.meta.url)));
  assert.deepEqual(resource, built);
});
