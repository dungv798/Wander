import test from 'node:test';
import assert from 'node:assert/strict';
import { S0, assignDay, createTrip } from '../model/tripFixtures.ts';
import { nextStop, todayState, visitedCount } from './todayState.ts';

let id = 0;
const base = createTrip(S0, { name: 'T', destinationId: 'd', startDate: '2026-11-01', endDate: '2026-11-03' }, [{ id: 'a', category: 'van' }, { id: 'b', category: 'am' }], () => String(++id), 1).trip;
const trip = base.items.reduce((t, item) => assignDay(t, item.id, '2026-11-01'), base);
const now = new Date('2026-10-30T12:00:00Z');

test('chưa tới ngày, sau ngày về, ngày giữa trống và ngày chưa chắc', () => {
  assert.deepEqual(todayState(trip, now, '2026-10-30'), { kind: 'before', daysLeft: 2 });
  assert.deepEqual(todayState(trip, now, '2026-11-04'), { kind: 'after' });
  assert.deepEqual(todayState(trip, now, '2026-11-02'), { kind: 'empty', day: '2026-11-02', dayNumber: 2 });
  assert.deepEqual(todayState({ ...trip, datesTentative: true }, now), { kind: 'tentative' });
});

test('không giờ giữ thứ tự, không lấy mục của ngày khác, không đổi đầu vào', () => {
  const otherDay = { ...trip.items[0]!, id: 'other', day: '2026-11-02', timeOfDay: '01:00' };
  const view = todayState({ ...trip, items: [...trip.items, otherDay] }, now, '2026-11-01');
  assert.equal(view.kind, 'day');
  if (view.kind !== 'day') return;
  const snapshot = structuredClone(view.items);
  const selected = nextStop(view.items);
  assert.equal(selected.next?.placeId, 'a');
  assert.equal(selected.next?.timeOfDay, null);
  assert.equal(selected.previous, null);
  assert.deepEqual(selected.remaining.map(i => i.placeId), ['b']);
  assert.deepEqual(view.items, snapshot);
});

test('mục có giờ đi trước; bỏ mục đã xong nhưng giữ điểm trước, hết mục trả null', () => {
  const first = { ...trip.items[0]!, done: true, timeOfDay: '07:00' };
  const second = { ...trip.items[1]!, timeOfDay: '08:00' };
  const view = todayState({ ...trip, items: [second, first] }, now, '2026-11-01');
  if (view.kind !== 'day') return assert.fail('phải có lịch ngày');
  assert.equal(nextStop(view.items).next?.id, second.id);
  assert.equal(nextStop(view.items).previous?.id, first.id);
  assert.equal(nextStop(view.items.map(i => ({ ...i, done: true }))).next, null);
  assert.equal(nextStop([]).next, null);
});

test('qua nửa đêm dùng lịch thiết bị hiện có, ngày giả lập luôn ưu tiên', () => {
  const beforeMidnight = new Date(2026, 9, 31, 23, 59);
  const afterMidnight = new Date(2026, 10, 1, 0, 1);
  assert.equal(todayState(trip, beforeMidnight).kind, 'before');
  assert.equal(todayState(trip, afterMidnight).kind, 'day');
  assert.equal(todayState(trip, afterMidnight, '2026-11-04').kind, 'after');
});

test('số nơi đã tới chỉ đếm địa điểm đã xong và không đếm trùng', () => {
  const done = { ...trip.items[0]!, done: true };
  assert.equal(visitedCount(trip.items), 0);
  assert.equal(visitedCount([done, { ...done, id: 'repeat', day: '2026-11-02' }, { ...done, placeId: null }]), 1);
});
