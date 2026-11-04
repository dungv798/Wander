import test from 'node:test';
import assert from 'node:assert/strict';
import { groupCosts } from './costView.ts';
import type { TripItem } from './trip.types.ts';

/** Mục mẫu, ghi đè các trường cần thử. */
function item(over: Partial<TripItem>): TripItem {
  return { id: 'x', placeId: null, type: 'food', title: 't', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: null, done: false, addedBy: null, doneBy: [], ...over };
}
const DAYS = ['d1', 'd2'];

test('theo ngày: tổng chỉ cộng mục đã biết giá; mục chưa rõ được đếm riêng; chưa có ngày nằm cuối', () => {
  const groups = groupCosts([
    item({ id: 'a', day: 'd1', costK: 120 }),
    item({ id: 'b', day: 'd1', type: 'sightseeing' }),
    item({ id: 'c', day: 'd1', type: 'sightseeing', costK: 0 }),
    item({ id: 'd', day: null, type: 'shopping' }),
    item({ id: 'e', day: 'd1', type: 'rest' }),
  ], 'day', DAYS);
  assert.deepEqual(groups.map((g) => g.key), ['d1', '']);
  assert.equal(groups[0]?.knownK, 120);
  assert.equal(groups[0]?.knownCount, 2);
  assert.equal(groups[0]?.unknownCount, 1);
  assert.equal(groups[0]?.items.length, 3);
});

test('"đã bao gồm" không cộng tiền và không tính là chưa rõ', () => {
  const [g] = groupCosts([item({ day: 'd1', costK: 500, included: true, referenceK: 25 })], 'day', DAYS);
  assert.equal(g?.knownK, 0);
  assert.equal(g?.unknownCount, 0);
  assert.equal(g?.includedCount, 1);
});

test('theo loại: theo thứ tự cố định, bỏ nhóm rỗng', () => {
  const groups = groupCosts([item({ type: 'lodging', costK: 450 }), item({ type: 'food', costK: 100 }), item({ type: 'task' })], 'kind', DAYS);
  assert.deepEqual(groups.map((g) => g.key), ['food', 'lodging']);
});
