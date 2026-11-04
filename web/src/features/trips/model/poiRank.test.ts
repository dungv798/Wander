import test from 'node:test';
import assert from 'node:assert/strict';
import { dayAnchors, displayKind, formatDistance, rankPoi } from './poiRank.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';

/** Quán mẫu với các trường tối thiểu. */
function poi(id: string, name: string, kind: PoiSuggestion['kind'], distanceM: number): PoiSuggestion {
  return { id, name, kind, lat: 0, lon: 0, distanceM, address: null, openingHoursRaw: null, openingHoursStatus: 'UNKNOWN', phone: null, website: null, verificationStatus: 'SNAPSHOT_UNVERIFIED', attribution: { sourceKind: 'osm', sourceUrl: '', snapshotAt: '', license: '', licenseUrl: '', credit: '' } };
}

test('quán tên cà phê nhưng nguồn ghi quán ăn thì hiển thị là cà phê; quán cơm giữ nguyên', () => {
  assert.equal(displayKind(poi('1', 'HighLand coffee', 'food', 100)), 'cafe');
  assert.equal(displayKind(poi('2', 'The Coffee House', 'food', 100)), 'cafe');
  assert.equal(displayKind(poi('3', 'Quán Cơm Niêu', 'food', 100)), 'food');
  assert.equal(displayKind(poi('4', 'Phở Hòa', 'food', 100)), 'food');
});

test('bữa chính xếp quán ăn trước cà phê dù cà phê gần hơn; bữa nghỉ ngược lại; không bỏ quán nào', () => {
  const list = [poi('c', 'HighLand coffee', 'food', 50), poi('f', 'Quán Cơm', 'food', 400), poi('f2', 'Bún bò', 'food', 200)];
  assert.deepEqual(rankPoi(list, 'lunch').map((p) => p.id), ['f2', 'f', 'c']);
  assert.deepEqual(rankPoi(list, 'rest').map((p) => p.id), ['c', 'f2', 'f']);
  assert.equal(rankPoi(list, 'dinner').length, 3);
});

test('khoảng cách dễ đọc', () => {
  assert.equal(formatDistance(4), '10 m');
  assert.equal(formatDistance(347), '350 m');
  assert.equal(formatDistance(1234), '1,2 km');
  assert.equal(formatDistance(2000), '2 km');
});

test('mốc trong ngày: theo thứ tự lịch, có trọng tâm khi từ hai điểm; không có tọa độ thì rỗng', () => {
  const places: Record<string, { name: string; lat: number | null; lon: number | null }> = { a: { name: 'A', lat: 10, lon: 100 }, b: { name: 'B', lat: 12, lon: 102 }, x: { name: 'X', lat: null, lon: null } };
  const place = (id: string | null) => (id ? (places[id] as never) ?? null : null);
  const items = [{ day: 'd', placeId: 'b', position: 1 }, { day: 'd', placeId: 'a', position: 0 }, { day: 'd', placeId: 'x', position: 2 }, { day: 'e', placeId: 'a', position: 0 }];
  const anchors = dayAnchors(items, 'd', place, 'Trọng tâm');
  assert.deepEqual(anchors.map((a) => a.name), ['A', 'B', 'Trọng tâm']);
  assert.deepEqual([anchors[2]?.lat, anchors[2]?.lon], [11, 101]);
  assert.deepEqual(dayAnchors(items, 'zz', place, 'T'), []);
});
