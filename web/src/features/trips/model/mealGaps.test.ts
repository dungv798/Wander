import test from 'node:test';
import assert from 'node:assert/strict';
import { mealGapEditor, mealGaps, mealGapStorageKey, readMealGapDismissals, saveMealGapDismissals } from './mealGaps.ts';
import type { TripItem } from './trip.types.ts';

const DAY = '2026-11-01';
const place = () => null;
/** Chỉ những trường cần cho luật nhắc; không phải dữ liệu gửi API. */
function item(fields: Partial<TripItem> = {}) {
  return { day: DAY, type: 'sightseeing' as const, title: 'Đồi thông', placeId: null, timeOfDay: null, durationMin: null, ...fields };
}
const three = [item(), item(), item()];

test('nhắc mở bản nháp đúng ngày, loại và tên; không gán giờ hoặc giá', () => {
  for (const [gap, preset, title] of [['lunch', 'food', 'Ăn trưa'], ['dinner', 'food', 'Ăn tối'], ['rest', 'rest', 'Nghỉ']] as const) {
    assert.deepEqual(mealGapEditor(gap, DAY), { kind: 'editor', itemId: null, preset, initial: { day: DAY, title } });
  }
});

test('ngày rỗng, một hoặc hai điểm chưa có giờ không nhắc', () => {
  for (const items of [[], [item()], [item(), item()]]) assert.deepEqual(mealGaps(items, DAY, place), []);
});
test('ba điểm không giờ nhắc trưa, không đoán có bữa tối; bốn điểm thêm nghỉ', () => {
  assert.deepEqual(mealGaps(three, DAY, place), ['lunch']);
  assert.deepEqual(mealGaps([...three, item()], DAY, place), ['lunch', 'rest']);
});
test('giờ đã nhập trải qua trưa và chiều tối; thời lượng có tính, không đặt giờ mới', () => {
  assert.deepEqual(mealGaps([item({ timeOfDay: '10:00' }), item({ timeOfDay: '14:00' }), item({ timeOfDay: '18:00' })], DAY, place), ['lunch', 'dinner']);
  assert.deepEqual(mealGaps([item({ timeOfDay: '11:00', durationMin: 180 })], DAY, place), ['lunch']);
  assert.deepEqual(mealGaps([item({ timeOfDay: 'sai' })], DAY, place), []);
});
test('bữa trưa có dấu hoặc không dấu chỉ che nhắc trưa, bữa tối vẫn hiện', () => {
  for (const title of ['Ăn trưa', 'Com trua', 'Phở trưa']) {
    assert.deepEqual(mealGaps([...three, item({ title, type: 'food' }), item({ timeOfDay: '19:00' })], DAY, place), ['dinner', 'rest']);
  }
});
test('loại ăn/nghỉ, catalog food/am và từ khóa thông dụng tránh nhắc trùng', () => {
  for (const title of ['Ăn', 'Cơm', 'Phở']) assert.deepEqual(mealGaps([...three, item({ title })], DAY, place), []);
  for (const category of ['food', 'am']) assert.deepEqual(mealGaps([...three, item({ placeId: 'p' })], DAY, (id) => id ? { category, name: 'Quán' } : null), []);
  assert.deepEqual(mealGaps([...three, item(), item({ type: 'rest', title: 'Nghỉ' })], DAY, place), ['lunch']);
  assert.deepEqual(mealGaps([...three, item({ type: 'food', title: 'Bữa' })], DAY, place), []);
  assert.deepEqual(mealGaps([item({ type: 'food' }), item({ type: 'rest' })], DAY, place), []);
});

test('quán cà phê chỉ lấp nhắc nghỉ, không làm biến mất bữa trưa cần có', () => {
  assert.deepEqual(mealGaps([...three, item({ title: 'Cà phê' })], DAY, place), ['lunch']);
  for (const category of ['cafe', 'coffee']) assert.deepEqual(mealGaps([...three, item({ placeId: 'p' })], DAY, () => ({ category, name: 'Quán' })), ['lunch']);
  assert.deepEqual(mealGaps([...three, item({ type: 'rest', placeId: 'p' })], DAY, () => ({ category: 'am', name: 'Giảng', venue: { kind: 'cafe' } })), ['lunch']);
  assert.deepEqual(mealGaps([...three, item({ type: 'rest', placeId: 'p' })], DAY, () => ({ category: 'am', name: 'Quán bar', venue: { kind: 'bar' } })), ['lunch']);
});
test('đóng từng nhắc; không lẫn bữa, ngày khác hoặc mục chưa xếp ngày', () => {
  assert.deepEqual(mealGaps(three, DAY, place, ['lunch']), []);
  assert.deepEqual(mealGaps([...three, item({ day: '2026-11-02', type: 'food' }), item({ day: null, type: 'rest' })], DAY, place), ['lunch']);
  assert.deepEqual(mealGaps(three, '2026-11-02', place), []);
  assert.notEqual(mealGapStorageKey('a', DAY), mealGapStorageKey('b', DAY));
  assert.notEqual(mealGapStorageKey('a', DAY), mealGapStorageKey('a', '2026-11-02'));
});
test('localStorage không khả dụng vẫn đọc/đóng được, không ném lỗi', () => {
  assert.deepEqual(readMealGapDismissals('missing'), []);
  assert.doesNotThrow(() => saveMealGapDismissals('missing', ['lunch']));
});
