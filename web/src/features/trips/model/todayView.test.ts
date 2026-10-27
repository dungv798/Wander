import test from 'node:test';
import assert from 'node:assert/strict';
import { S0, assignDay, createTrip, freeItem, addItem, updateItem } from './tripFixtures.ts';
import { itemsByTime, pickTodayTrip, todayView } from './todayView.ts';
import type { Trip } from './trip.types.ts';

let n = 0;
/** Mã tăng dần để test xác định. */
const ids = (): string => `id${(n += 1)}`;

/** Chuyến 3 ngày 10/11–12/11 có hai mục ở ngày 2. */
function trip(over: Partial<Trip> = {}): Trip {
  let t = createTrip(S0, { name: 'T', destinationId: 'd', startDate: '2026-11-10', endDate: '2026-11-12' }, [{ id: 'a', category: 'van' }, { id: 'b', category: 'am' }], ids, 1).trip;
  t = t.items.reduce((acc, i) => assignDay(acc, i.id, '2026-11-11'), t);
  return { ...t, ...over };
}

test('trước ngày đi: báo còn bao nhiêu ngày; sau ngày về: đã kết thúc', () => {
  assert.deepEqual(todayView(trip(), '2026-11-08'), { kind: 'before', daysLeft: 2 });
  assert.deepEqual(todayView(trip(), '2026-11-09'), { kind: 'before', daysLeft: 1 });
  assert.deepEqual(todayView(trip(), '2026-11-13'), { kind: 'after' });
});

test('chuyến chưa chắc ngày không đoán hôm nay là ngày nào', () => {
  assert.deepEqual(todayView(trip({ datesTentative: true }), '2026-11-11'), { kind: 'tentative' });
});

test('hôm nay chưa có mục: ngày thứ mấy, trống; hôm nay có mục: số ngày, tổng đã biết giá, số chưa biết giá', () => {
  assert.deepEqual(todayView(trip(), '2026-11-10'), { kind: 'empty', dayNumber: 1, day: '2026-11-10' });
  let t = trip();
  t = updateItem(t, t.items[0]!.id, { costK: 100 });
  const v = todayView(t, '2026-11-11');
  assert.equal(v.kind, 'day');
  if (v.kind !== 'day') return;
  assert.equal(v.dayNumber, 2);
  assert.equal(v.totalK, 100);
  assert.equal(v.unknownCount, 1, 'mục kia chưa biết giá');
});

test('mục xếp theo giờ; mục không giờ xuống cuối giữ thứ tự xếp', () => {
  let t = trip();
  t = addItem(t, { ...freeItem('food', 'Ăn sáng', ids), day: '2026-11-11', timeOfDay: '07:30' });
  const order = itemsByTime(todayView(t, '2026-11-11').kind === 'day' ? (todayView(t, '2026-11-11') as { items: Trip['items'] }).items : []).map((i) => i.title || i.placeId);
  assert.equal(order[0], 'Ăn sáng');
  assert.deepEqual(order.slice(1), ['a', 'b']);
});

test('chọn chuyến: đang diễn ra > sắp tới gần nhất > vừa qua gần nhất > đầu danh sách; bỏ qua chuyến chưa chắc ngày', () => {
  const live = trip({ id: 'live' });
  const soon = trip({ id: 'soon', startDate: '2026-12-01', endDate: '2026-12-03' });
  const later = trip({ id: 'later', startDate: '2027-01-01', endDate: '2027-01-02' });
  const old = trip({ id: 'old', startDate: '2026-01-01', endDate: '2026-01-03' });
  const tent = trip({ id: 'tent', datesTentative: true });
  assert.equal(pickTodayTrip([later, soon, live, old, tent], '2026-11-11')?.id, 'live');
  assert.equal(pickTodayTrip([later, soon, old, tent], '2026-11-20')?.id, 'soon');
  assert.equal(pickTodayTrip([old, tent], '2026-11-20')?.id, 'old');
  assert.equal(pickTodayTrip([tent], '2026-11-20')?.id, 'tent');
  assert.equal(pickTodayTrip([], '2026-11-20'), null);
});
