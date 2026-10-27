import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_TRIPS_STATE as S0, addItem, addPlaces, applyPlan, assignDay, createTrip, editTrip, freeItem, mapTrip, moveItem, normalize, randomId, toggleDone, uniqueName, updateItem } from './tripState.ts';

let n = 0;
/** Mã tăng dần để test xác định. */
const ids = (): string => `id${(n += 1)}`;

/** Chuyến mẫu 3 ngày có 2 địa điểm. */
function sample() {
  return createTrip(S0, { name: 'Hà Giang', destinationId: 'ha-giang', startDate: '2026-10-31', endDate: '2026-11-02' }, [{ id: 'p1', category: 'van' }, { id: 'p2', category: 'am' }], ids, 1).trip;
}

test('tạo chuyến: địa điểm thành mục chưa có ngày, loại suy ra từ loại địa điểm', () => {
  const t = sample();
  assert.deepEqual(t.items.map((i) => [i.placeId, i.type, i.day]), [['p1', 'sightseeing', null], ['p2', 'food', null]]);
  assert.equal(t.datesTentative, false);
});

test('tên trùng thêm hậu tố - 2, - 3 (DR-006)', () => {
  const a = createTrip(S0, { name: 'X', destinationId: 'd', startDate: '2026-01-01', endDate: '2026-01-01' }, [], ids).state;
  assert.equal(uniqueName(a.trips, 'X'), 'X - 2');
  const b = createTrip(a, { name: 'X', destinationId: 'd', startDate: '2026-01-01', endDate: '2026-01-01' }, [], ids).state;
  assert.equal(uniqueName(b.trips, 'X'), 'X - 3');
});

test('thêm địa điểm không trùng', () => {
  const t = addPlaces(sample(), [{ id: 'p1', category: 'van' }, { id: 'p3', category: 'canh' }], ids);
  assert.deepEqual(t.items.map((i) => i.placeId), ['p1', 'p2', 'p3']);
});

test('xếp ngày đưa mục xuống cuối ngày; đưa về chưa có ngày thì bỏ vị trí', () => {
  let t = sample();
  const [a, b] = [t.items[0]!, t.items[1]!];
  t = assignDay(assignDay(t, a.id, '2026-10-31'), b.id, '2026-10-31');
  assert.deepEqual(t.items.map((i) => i.position), [0, 1]);
  t = assignDay(t, a.id, null);
  assert.equal(t.items[0]?.day, null);
  assert.equal(t.items[0]?.position, null);
});

test('đổi chỗ lên/xuống và không vượt biên', () => {
  let t = sample();
  const [a, b] = [t.items[0]!, t.items[1]!];
  t = assignDay(assignDay(t, a.id, '2026-10-31'), b.id, '2026-10-31');
  t = moveItem(t, b.id, 'up');
  assert.deepEqual(t.items.map((i) => [i.id, i.position]), [[a.id, 1], [b.id, 0]]);
  assert.equal(moveItem(t, b.id, 'up'), t, 'đã ở đầu thì không đổi');
});

test('sửa mục: đổi sang Nghỉ xóa tiền và đặt chỗ; bỏ "đã bao gồm" xóa giá tham khảo', () => {
  let t = addItem(sample(), freeItem('food', 'Ăn trưa', ids));
  const id = t.items[2]!.id;
  t = updateItem(t, id, { costK: 120, included: true, referenceK: 30, booking: 'booked' });
  assert.equal(t.items[2]?.referenceK, 30);
  t = updateItem(t, id, { included: false });
  assert.equal(t.items[2]?.referenceK, null, 'R4');
  t = updateItem(t, id, { type: 'rest' });
  assert.deepEqual([t.items[2]?.costK, t.items[2]?.booking, t.items[2]?.included], [null, null, false]);
});

test('Việc cần làm đánh dấu xong; loại khác bỏ qua', () => {
  let t = addItem(sample(), freeItem('task', 'Đổ xăng', ids));
  const task = t.items[2]!.id;
  t = toggleDone(toggleDone(t, task), task);
  assert.equal(t.items[2]?.done, false);
  assert.deepEqual(toggleDone(t, t.items[0]!.id), t);
  assert.equal(toggleDone(toggleDone(t, task), task).items[2]?.done, false);
});

test('sửa ngày: giữ số ngày thì dời lịch; cắt ngày thì mục về chưa có ngày và đếm số mục bị đẩy', () => {
  let t = sample();
  const [a, b] = [t.items[0]!, t.items[1]!];
  t = assignDay(assignDay(t, a.id, '2026-10-31'), b.id, '2026-11-02');
  const shifted = editTrip(t, { name: 'Mới', startDate: '2026-11-07', endDate: '2026-11-09', shift: true, confirmDates: false });
  assert.deepEqual(shifted.trip.items.map((i) => i.day), ['2026-11-07', '2026-11-09']);
  assert.equal(shifted.lost, 0);
  const cut = editTrip(t, { name: 'Mới', startDate: '2026-10-31', endDate: '2026-11-01', shift: true, confirmDates: false });
  assert.equal(cut.lost, 1);
  assert.deepEqual(cut.trip.items.map((i) => [i.day, i.position]), [['2026-10-31', 0], [null, null]]);
});

test('chốt ngày bỏ nhãn chưa chắc; kế hoạch xếp ngày áp đúng ngày và vị trí', () => {
  const tentative = { ...sample(), datesTentative: true };
  assert.equal(editTrip(tentative, { name: 'a', startDate: tentative.startDate, endDate: tentative.endDate, shift: false, confirmDates: true }).trip.datesTentative, false);
  const t = applyPlan(sample(), { [sample().items[0]!.id]: { day: 'x', position: 3 } });
  assert.equal(mapTrip({ trips: [t] }, 'khong-co', (z) => z).trips[0], t);
});

test('chuyển mục sang ngày khác rồi thêm mục vào ngày cũ: thứ tự luôn 0..n-1, không trùng (bất biến như backend)', () => {
  let t = addPlaces(sample(), [{ id: 'p3', category: 'canh' }], ids);
  const [a, b, c] = [t.items[0]!, t.items[1]!, t.items[2]!];
  t = assignDay(assignDay(assignDay(t, a.id, '2026-10-31'), b.id, '2026-10-31'), c.id, '2026-10-31');
  t = assignDay(t, b.id, '2026-11-01');
  assert.deepEqual(t.items.filter((i) => i.day === '2026-10-31').map((i) => i.position).sort(), [0, 1], 'ngày cũ được đánh số lại sau khi chuyển B đi');
  t = addItem(t, { ...freeItem('food', 'D', ids), day: '2026-10-31' });
  const day = t.items.filter((i) => i.day === '2026-10-31').sort((x, y) => (x.position ?? 0) - (y.position ?? 0));
  assert.deepEqual(day.map((i) => i.position), [0, 1, 2]);
  assert.equal(day[2]?.title, 'D', 'mục mới ở cuối ngày');
  assert.deepEqual(normalize(t), t, 'normalize ổn định (chạy lại không đổi)');
});

test('chọn lại đúng ngày hiện tại không đổi gì; kế hoạch cũ không ghi đè mục đã có ngày hoặc ngày ngoài chuyến', () => {
  const base = sample();
  const t = assignDay(base, base.items[0]!.id, '2026-10-31');
  assert.equal(assignDay(t, t.items[0]!.id, '2026-10-31'), t);
  const stale = applyPlan(t, { [t.items[0]!.id]: { day: '2026-11-02', position: 0 }, [t.items[1]!.id]: { day: '2030-01-01', position: 0 } });
  assert.equal(stale.items[0]?.day, '2026-10-31', 'mục đã có ngày không bị kế hoạch cũ ghi đè');
  assert.equal(stale.items[1]?.day, null, 'ngày ngoài chuyến bị bỏ');
});

test('tên trùng khi thêm hậu tố vẫn ≤ 120 ký tự', () => {
  const long = 'x'.repeat(120);
  const s = createTrip(S0, { name: long, destinationId: 'd', startDate: '2026-01-01', endDate: '2026-01-01' }, [], ids).state;
  const next = uniqueName(s.trips, long);
  assert.equal(next.length, 120);
  assert.ok(next.endsWith(' - 2'));
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
