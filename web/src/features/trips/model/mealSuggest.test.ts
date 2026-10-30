import test from 'node:test';
import assert from 'node:assert/strict';
import { mealAnchor, mealPoiKind, poiEditor } from './mealSuggest.ts';
import type { TripCatalog } from './tripView.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';

const DAY = '2026-11-01';
const items = ['a', 'b', 'c'].map((placeId, position) => ({ day: DAY, placeId, position, timeOfDay: null as string | null }));
const place = ((id: string | null) => id && ['a', 'b', 'c'].includes(id) ? { name: id, lat: 10 + ['a', 'b', 'c'].indexOf(id), lon: 100 + ['a', 'b', 'c'].indexOf(id) } : null) as TripCatalog['place'];

test('không tọa độ hoặc sai ngày không tạo mốc giả', () => {
  assert.equal(mealAnchor(items, DAY, 'lunch', () => null), null);
  assert.equal(mealAnchor(items, '2026-11-02', 'lunch', place), null);
});
test('một điểm dùng chính điểm đó cho mọi nhu cầu', () => {
  for (const gap of ['lunch', 'dinner', 'rest'] as const) assert.deepEqual(mealAnchor(items.slice(0, 1), DAY, gap, place), { lat: 10, lon: 100, name: 'a' });
});
test('nhiều điểm không giờ: trưa trọng tâm, nghỉ giữa, tối cuối theo position', () => {
  assert.deepEqual(mealAnchor(items, DAY, 'lunch', place), { lat: 11, lon: 101, name: 'trọng tâm các điểm trong ngày' });
  assert.equal(mealAnchor(items.slice().reverse(), DAY, 'dinner', place)?.name, 'c');
  assert.equal(mealAnchor(items, DAY, 'rest', place)?.name, 'b');
});
test('trưa ưu tiên gần 12h trong điểm có giờ, bỏ giờ hỏng', () => {
  const timed = items.map((i, n) => ({ ...i, timeOfDay: ['11:45', '14:00', 'sai'][n]! }));
  assert.equal(mealAnchor(timed, DAY, 'lunch', place)?.name, 'a');
  assert.equal(mealAnchor(timed, DAY, 'dinner', place)?.name, 'c');
});
test('nghỉ tìm cafe; bữa trưa/tối tìm food; chọn chỉ trả bản nháp không placeId', () => {
  assert.equal(mealPoiKind('lunch'), 'food');
  assert.equal(mealPoiKind('dinner'), 'food');
  assert.equal(mealPoiKind('rest'), 'cafe');
  const poi = { name: 'Quán thật', address: '12 Đường A' } as PoiSuggestion;
  assert.deepEqual(poiEditor('lunch', DAY, poi), { kind: 'editor', itemId: null, preset: 'food', initial: { day: DAY, title: 'Quán thật', note: 'Nguồn: OpenStreetMap\n12 Đường A' } });
  assert.equal(poiEditor('rest', DAY, { ...poi, address: null }).initial.note, 'Nguồn: OpenStreetMap');
});
