import test from 'node:test';
import assert from 'node:assert/strict';
import { editTrip, randomId, uniqueName } from './tripState.ts';
import type { Trip, TripItem } from './trip.types.ts';

const item = (id: string, day: string | null, position: number | null): TripItem => ({ id, placeId: null, type: 'food', title: id, day, position, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false });
const trip = (name: string, items: TripItem[] = [], over: Partial<Trip> = {}): Trip => ({ id: name, name, destinationId: 'd', startDate: '2026-10-31', endDate: '2026-11-02', datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: null, items, trash: [], createdAt: 1, ...over });

test('tên trùng thêm hậu tố - 2, - 3 (DR-006)', () => {
  assert.equal(uniqueName([trip('X')], 'X'), 'X - 2');
  assert.equal(uniqueName([trip('X'), trip('X - 2')], 'X'), 'X - 3');
});

test('tên trùng khi thêm hậu tố vẫn ≤ 120 ký tự', () => {
  const long = 'x'.repeat(120);
  const next = uniqueName([trip(long)], long);
  assert.equal(next.length, 120);
  assert.ok(next.endsWith(' - 2'));
});

test('sửa ngày: giữ số ngày thì dời lịch; cắt ngày thì mục về chưa có ngày và đếm số mục bị đẩy', () => {
  const t = trip('T', [item('a', '2026-10-31', 0), item('b', '2026-11-02', 0)]);
  const shifted = editTrip(t, { name: 'Mới', startDate: '2026-11-07', endDate: '2026-11-09', shift: true, confirmDates: false });
  assert.deepEqual(shifted.trip.items.map((i) => i.day), ['2026-11-07', '2026-11-09']);
  assert.equal(shifted.lost, 0);
  const cut = editTrip(t, { name: 'Mới', startDate: '2026-10-31', endDate: '2026-11-01', shift: true, confirmDates: false });
  assert.equal(cut.lost, 1);
  assert.deepEqual(cut.trip.items.map((i) => [i.day, i.position]), [['2026-10-31', 0], [null, null]]);
});

test('chốt ngày bỏ nhãn chưa chắc', () => {
  const tentative = trip('T', [], { datesTentative: true });
  assert.equal(editTrip(tentative, { name: 'a', startDate: tentative.startDate, endDate: tentative.endDate, shift: false, confirmDates: true }).trip.datesTentative, false);
});

test('randomId dự phòng khi không có crypto.randomUUID (mở qua http://địa-chỉ-LAN)', () => {
  const original = crypto.randomUUID;
  try {
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true });
    assert.match(randomId(), /^[0-9a-f]{32}$/);
  } finally {
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true });
  }
});
