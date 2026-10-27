import test from 'node:test';
import assert from 'node:assert/strict';
import { revertPlan } from './revertPlan.ts';
import type { Trip, TripItem } from './trip.types.ts';

const item = (id: string, day: string | null, position: number | null): TripItem => ({ id, placeId: null, type: 'food', title: id, day, position, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false });
const trip = (items: TripItem[], over: Partial<Trip> = {}, trash: Trip['trash'] = []): Trip => ({ id: 't', name: 'A', destinationId: 'd', startDate: '2026-11-01', endDate: '2026-11-03', datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: null, items, trash, createdAt: 1, ...over });
const entry = (i: TripItem): Trip['trash'][number] => ({ id: i.id, item: i, deletedAt: 5, day: i.day, position: i.position });
const D1 = '2026-11-01';
const D2 = '2026-11-02';

test('không đổi gì thì không có lệnh ngược', () => {
  const t = trip([item('a', D1, 0)]);
  assert.deepEqual(revertPlan(t, t), []);
});

test('đổi ngày một mục: gán lại ngày và vị trí cũ (kể cả về "Chưa có ngày")', () => {
  const before = trip([item('a', D1, 0), item('b', null, null)]);
  const after = trip([item('a', D2, 0), item('b', D1, 1)]);
  assert.deepEqual(revertPlan(before, after), [{ kind: 'schedule', change: { assignments: [{ itemId: 'a', day: D1, position: 0 }, { itemId: 'b', day: null }] } }]);
});

test('đổi khoảng ngày: khôi phục ngày đi/về cũ trong cùng lệnh lịch', () => {
  const before = trip([item('a', D1, 0)]);
  const after = trip([item('a', null, null)], { startDate: '2026-12-01', endDate: '2026-12-03' });
  assert.deepEqual(revertPlan(before, after), [{ kind: 'schedule', change: { startDate: '2026-11-01', endDate: '2026-11-03', assignments: [{ itemId: 'a', day: D1, position: 0 }] } }]);
});

test('xếp lại trong cùng một ngày: gán lại thứ tự cũ', () => {
  const before = trip([item('a', D1, 0), item('b', D1, 1)]);
  const after = trip([item('a', D1, 1), item('b', D1, 0)]);
  assert.deepEqual(revertPlan(before, after), [{ kind: 'schedule', change: { assignments: [{ itemId: 'a', day: D1, position: 0 }, { itemId: 'b', day: D1, position: 1 }] } }]);
});

test('xóa mềm một mục: hoàn tác là khôi phục; thứ hạng của mục còn lại dồn lại không bị gán đè', () => {
  const a = item('a', D1, 0);
  const b = item('b', D1, 1);
  const before = trip([a, b]);
  const after = trip([item('b', D1, 0)], {}, [entry(a)]);
  assert.deepEqual(revertPlan(before, after), [{ kind: 'restore', itemId: 'a' }]);
});

test('khôi phục một mục từ thùng rác: hoàn tác là xóa mềm lại', () => {
  const a = item('a', D1, 0);
  const before = trip([], {}, [entry(a)]);
  const after = trip([a]);
  assert.deepEqual(revertPlan(before, after), [{ kind: 'trash', itemId: 'a' }]);
});

test('đổi tên và nhãn "chưa chắc": hoàn tác bằng PATCH; thứ tự lệnh lịch → khôi phục → xóa → PATCH', () => {
  const a = item('a', D1, 0);
  const c = item('c', D1, 1);
  const before = trip([a], { name: 'Cũ', datesTentative: true }, [entry(c)]);
  const after = trip([item('a', D2, 0), c], { name: 'Mới', datesTentative: false });
  assert.deepEqual(revertPlan(before, after).map((s) => s.kind), ['schedule', 'trash', 'patch']);
  assert.deepEqual(revertPlan(before, after).at(-1), { kind: 'patch', patch: { name: 'Cũ', datesTentative: true } });
});

test('sửa nội dung một mục (giá, ghi chú…): hoàn tác bằng lệnh sửa mục với giá trị cũ, chỉ các trường đã đổi', () => {
  const before = trip([item('a', D1, 0)]);
  const after = trip([{ ...item('a', D1, 0), costK: 120, note: 'x' }]);
  assert.deepEqual(revertPlan({ ...before, items: [{ ...before.items[0]!, costK: null, note: '' }] }, after), [{ kind: 'edit', itemId: 'a', change: { costK: null, note: '' } }]);
});

test('thêm một mục mới: hoàn tác là bỏ hẳn mục đó (xóa mềm rồi xóa vĩnh viễn); mục cũ nằm thùng rác thì không tính là mới', () => {
  const before = trip([item('a', D1, 0)]);
  const after = trip([item('a', D1, 0), item('n', D1, 1)]);
  assert.deepEqual(revertPlan(before, after), [{ kind: 'discard', itemId: 'n' }]);
});
