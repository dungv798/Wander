import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTripsState } from './tripSanitize.ts';

const GOOD_ITEM = { id: 'i1', placeId: 'p', type: 'food', title: '', day: '2026-10-31', position: 0, timeOfDay: '09:30', durationMin: 60, note: 'n', costK: 100, included: false, referenceK: null, booking: 'booked', done: false };
const GOOD_TRIP = { id: 't', name: 'T', destinationId: 'ha-giang', startDate: '2026-10-31', endDate: '2026-11-02', datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: 5000, items: [GOOD_ITEM], createdAt: 1 };

test('dữ liệu hợp lệ giữ nguyên', () => {
  const s = sanitizeTripsState({ trips: [GOOD_TRIP] });
  assert.deepEqual(s?.trips[0]?.items[0], GOOD_ITEM);
  assert.equal(s?.trips[0]?.budgetK, 5000);
});

test('không phải đối tượng có trips thì null', () => {
  for (const bad of [null, [], 'x', { trips: 'x' }, { khac: 1 }]) assert.equal(sanitizeTripsState(bad), null);
});

test('chuyến hỏng ngày bị bỏ, mục lạ bị bỏ, phần còn lại giữ', () => {
  const s = sanitizeTripsState({ trips: [{ ...GOOD_TRIP, startDate: '2026-02-30' }, { ...GOOD_TRIP, id: 't2', items: [GOOD_ITEM, { id: 'z', type: 'khong-co' }, null] }] });
  assert.equal(s?.trips.length, 1);
  assert.equal(s?.trips[0]?.items.length, 1);
});

test('ràng buộc loại mục: Nghỉ không giá/đặt chỗ; giá tham khảo chỉ khi đã bao gồm; âm bị bỏ', () => {
  const s = sanitizeTripsState({ trips: [{ ...GOOD_TRIP, items: [{ ...GOOD_ITEM, id: 'r', type: 'rest', costK: 5, booking: 'booked' }, { ...GOOD_ITEM, id: 'f', referenceK: 9, costK: -1 }] }] });
  const [rest, food] = s!.trips[0]!.items;
  assert.deepEqual([rest?.costK, rest?.booking], [null, null]);
  assert.deepEqual([food?.referenceK, food?.costK], [null, null]);
});

test('mục có ngày ngoài khoảng về "Chưa có ngày"; mã trùng chỉ giữ bản đầu; sở thích trùng gộp', () => {
  const s = sanitizeTripsState({ trips: [{ ...GOOD_TRIP, interests: ['canh', 'canh', 'van'], items: [{ ...GOOD_ITEM, day: '2030-01-01' }, { ...GOOD_ITEM, costK: 1 }, { ...GOOD_ITEM, id: 'i2' }] }, { ...GOOD_TRIP }] });
  assert.equal(s?.trips.length, 1, 'mã chuyến trùng bị bỏ');
  const trip = s!.trips[0]!;
  assert.deepEqual(trip.items.map((i) => i.id), ['i1', 'i2']);
  assert.equal(trip.items[0]?.day, null);
  assert.deepEqual(trip.interests, ['canh', 'van']);
});
