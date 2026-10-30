import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAddPlaces, missingPlaces, togglePlace, validAddDay } from './addMany.ts';
import type { TripItem } from './trip.types.ts';

const places = [{ id: 'a', name: 'Đồi thông', category: 'canh' }, { id: 'b', name: 'Bún bò', category: 'am' }];
test('chọn nhiều duy nhất, bỏ chọn; tìm và chip không làm mất lựa chọn', () => {
  const chosen = togglePlace(togglePlace([], 'a'), 'b');
  assert.deepEqual(chosen, ['a', 'b']);
  assert.deepEqual(togglePlace(chosen, 'a'), ['b']);
  assert.deepEqual(filterAddPlaces(places, 'DOI', 'canh'), [places[0]]);
  assert.deepEqual(filterAddPlaces(places, 'doi', 'am'), []);
  assert.deepEqual(chosen, ['a', 'b']);
});
test('loại nơi đã có và mã lặp; thử lại sau thêm một phần chỉ còn nơi thiếu', () => {
  const partial = { items: [{ placeId: 'a' }] as TripItem[] };
  assert.deepEqual(missingPlaces([...places, places[1]!], partial), [places[1]]);
  assert.deepEqual(missingPlaces(places, { items: places.map(p => ({ placeId: p.id })) as TripItem[] }), []);
});
test('ngày null hoặc thuộc khoảng gồm hai đầu; ngày cũ sau sửa chuyến bị chặn', () => {
  const trip = { startDate: '2026-11-01', endDate: '2026-11-03' };
  for (const day of [null, '2026-11-01', '2026-11-02', '2026-11-03']) assert.equal(validAddDay(trip, day), true);
  assert.equal(validAddDay(trip, '2026-11-04'), false);
  assert.equal(validAddDay({ ...trip, endDate: '2026-11-01' }, '2026-11-02'), false);
});
