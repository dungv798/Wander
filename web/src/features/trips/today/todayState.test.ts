import test from 'node:test';
import assert from 'node:assert/strict';
import { S0, assignDay, createTrip } from '../model/tripFixtures.ts';
import { nextStop, todayState, visitedCount, visitedProgress } from './todayState.ts';
import { canCompleteItem, isPlaceItem } from '../model/itemCompletion.ts';
import type { ItemKind } from '../model/trip.types.ts';

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

test('đếm từng mục địa điểm: cùng nơi hai lượt là hai trạng thái độc lập', () => {
  const done = { ...trip.items[0]!, done: true };
  assert.equal(visitedCount(trip.items), 0);
  assert.equal(visitedCount([done, { ...done, id: 'repeat', day: '2026-11-02' }, { ...done, placeId: null }]), 2);
  assert.equal(visitedCount([done, { ...done, id: 'repeat', done: false }]), 1);
  assert.equal(visitedCount([{ ...done, done: false }]), 0);
});

test('không đếm task hoặc nghỉ thành nơi đã ghé dù dữ liệu có placeId', () => {
  const done = { ...trip.items[0]!, done: true };
  assert.equal(visitedCount([{ ...done, type: 'task' }, { ...done, type: 'rest' }]), 0);
});

test('điểm kế tiếp bỏ qua nghỉ/mục tự do, vẫn giữ chúng trong danh sách; không lấy doneBy làm dấu của mình', () => {
  const rest = { ...trip.items[0]!, id: 'rest', type: 'rest' as const, placeId: null };
  const free = { ...rest, id: 'free', type: 'food' as const };
  const place = { ...trip.items[1]!, done: false, doneBy: ['someone-else'] };
  const task = { ...rest, id: 'task', type: 'task' as const };
  const selected = nextStop([rest, free, place, task]);
  assert.equal(selected.next?.id, place.id);
  assert.deepEqual(selected.remaining.map(i => i.id), ['rest', 'free', 'task']);
  assert.equal(visitedCount([place]), 0);
  assert.equal(nextStop([rest, free]).next, null);
});

test('tỷ lệ cá nhân 0/m, n/m và 0/0; toàn chuyến gồm mục chưa có ngày, không gồm mục đã xóa', () => {
  const first = { ...trip.items[0]!, done: true };
  const repeat = { ...first, id: 'repeat', day: '2026-11-02', done: false, doneBy: ['other'] };
  const unscheduled = { ...first, id: 'unscheduled', day: null };
  const t = { ...trip, items: [first, repeat, unscheduled], trash: [{ id: 'deleted', item: { ...first, id: 'deleted' }, day: first.day, position: 0, deletedAt: 1 }] };
  assert.deepEqual(visitedProgress(t.items), { visited: 2, total: 3 });
  const view = todayState(t, now, '2026-11-01');
  if (view.kind !== 'day') return assert.fail('cần lịch ngày');
  assert.deepEqual(visitedProgress(view.items), { visited: 1, total: 1 });
  assert.deepEqual(visitedProgress([repeat]), { visited: 0, total: 1 });
  assert.deepEqual(visitedProgress([{ ...first, done: false }, repeat]), { visited: 0, total: 2 });
  assert.deepEqual(visitedProgress([]), { visited: 0, total: 0 });
});

test('mọi loại địa điểm khớp backend; task có tích nhưng không phải nơi, nghỉ và mục tự do không có tích', () => {
  const types: ItemKind[] = ['sightseeing', 'food', 'transport', 'lodging', 'car_rental', 'shopping', 'tour', 'rest', 'task'];
  for (const type of types) {
    const item = { ...trip.items[0]!, type };
    assert.equal(isPlaceItem(item), type !== 'rest' && type !== 'task');
    assert.equal(canCompleteItem(item), type !== 'rest');
    assert.equal(canCompleteItem({ ...item, placeId: null }), type === 'task');
  }
});
