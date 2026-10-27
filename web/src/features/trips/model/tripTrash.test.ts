import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_TRIPS_STATE as S0, assignDay, createTrip, editTrip, freeItem } from './tripState.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { agoText, isDuplicateRestore, purgeItem, restoreItem, trashFull, trashItem } from './tripTrash.ts';
import { sanitizeTripsState } from './tripSanitize.ts';
import type { Trip } from './trip.types.ts';

let n = 0;
/** Mã tăng dần để test xác định. */
const ids = (): string => `id${(n += 1)}`;
const D1 = '2026-10-31';
const D2 = '2026-11-01';

/** Chuyến 2 ngày: ngày 1 có ba địa điểm a, b, c (vị trí 0, 1, 2), ngày 2 để trống. */
function sample(): Trip {
  const t = createTrip(S0, { name: 'T', destinationId: 'ha-giang', startDate: D1, endDate: D2 }, [{ id: 'a', category: 'van' }, { id: 'b', category: 'am' }, { id: 'c', category: 'canh' }], ids, 1).trip;
  return t.items.reduce((acc, i) => assignDay(acc, i.id, D1), t);
}

/** Mã mục theo mã địa điểm. */
const idOf = (t: Trip, placeId: string): string => t.items.find((i) => i.placeId === placeId)!.id;

test('xóa mềm đưa mục vào Đã xóa gần đây, nhớ ngày/vị trí, và đánh số lại ngày cũ 0..n-1', () => {
  const t = sample();
  const out = trashItem(t, idOf(t, 'b'), 'e1', 1000);
  assert.deepEqual(out.items.map((i) => [i.placeId, i.position]), [['a', 0], ['c', 1]]);
  assert.deepEqual(out.trash.map((e) => [e.id, e.day, e.position, e.deletedAt]), [['e1', D1, 1, 1000]]);
  assert.equal(trashItem(t, 'khong-co', 'e2', 1), t, 'mục không có thì không đổi gì');
});

test('mục xóa sau nằm trước trong thùng rác', () => {
  const t = sample();
  const out = trashItem(trashItem(t, idOf(t, 'a'), 'e1', 1), idOf(t, 'c'), 'e2', 2);
  assert.deepEqual(out.trash.map((e) => e.id), ['e2', 'e1']);
});

test('khôi phục về đúng ngày và đúng vị trí cũ, các mục sau dịch xuống', () => {
  const t = sample();
  const gone = trashItem(t, idOf(t, 'a'), 'e1', 1);
  const r = restoreItem(gone, 'e1')!;
  assert.equal(r.dayLost, false);
  assert.deepEqual([...r.trip.items].sort((x, y) => (x.position ?? 0) - (y.position ?? 0)).map((i) => [i.placeId, i.position]), [['a', 0], ['b', 1], ['c', 2]]);
  assert.deepEqual(r.trip.trash, []);
});

test('khôi phục mục từng ở giữa: vào giữa, không đè mục khác', () => {
  const t = sample();
  const r = restoreItem(trashItem(t, idOf(t, 'b'), 'e1', 1), 'e1')!;
  assert.deepEqual([...r.trip.items].sort((x, y) => (x.position ?? 0) - (y.position ?? 0)).map((i) => i.placeId), ['a', 'b', 'c']);
});

test('ngày cũ không còn trong chuyến: về Chưa có ngày và báo dayLost', () => {
  const t = sample();
  const gone = trashItem(t, idOf(t, 'a'), 'e1', 1);
  const shorter = editTrip(gone, { name: 'T', startDate: D2, endDate: D2, shift: false, confirmDates: false }).trip;
  const r = restoreItem(shorter, 'e1')!;
  assert.equal(r.dayLost, true);
  const back = r.trip.items.find((i) => i.placeId === 'a')!;
  assert.equal(back.day, null);
  assert.equal(back.position, null);
});

test('khôi phục mục từng ở Chưa có ngày: dayLost = false, vẫn Chưa có ngày', () => {
  const t = createTrip(S0, { name: 'T', destinationId: 'd', startDate: D1, endDate: D2 }, [{ id: 'a', category: 'van' }], ids, 1).trip;
  const r = restoreItem(trashItem(t, t.items[0]!.id, 'e1', 1), 'e1')!;
  assert.equal(r.dayLost, false);
  assert.equal(r.trip.items[0]?.day, null);
});

test('khôi phục mã không có thì null; xóa vĩnh viễn chỉ bỏ đúng mục đó', () => {
  const t = sample();
  const gone = trashItem(trashItem(t, idOf(t, 'a'), 'e1', 1), idOf(t, 'b'), 'e2', 2);
  assert.equal(restoreItem(gone, 'khong-co'), null);
  assert.deepEqual(purgeItem(gone, 'e1').trash.map((e) => e.id), ['e2']);
});

test('mục tự do và việc cần làm giữ nguyên dữ liệu qua xóa/khôi phục', () => {
  let t = sample();
  const task = { ...freeItem('task', 'Mua vé', ids), done: true };
  t = { ...t, items: [...t.items, task] };
  const r = restoreItem(trashItem(t, task.id, 'e1', 1), 'e1')!;
  const back = r.trip.items.find((i) => i.id === task.id)!;
  assert.equal(back.title, 'Mua vé');
  assert.equal(back.done, true);
});

test('thùng rác qua làm sạch: mục hợp lệ giữ, ngày cũ giữ để báo đúng lý do, mã trùng/hỏng bỏ', () => {
  const t = sample();
  const gone = trashItem(t, idOf(t, 'a'), 'e1', 5);
  const raw = JSON.parse(JSON.stringify({ trips: [{ ...gone, trash: [...gone.trash, gone.trash[0], { id: 'x', item: { id: 'q', type: 'khong-co' } }, null] }] }));
  const s = sanitizeTripsState(raw)!;
  assert.deepEqual(s.trips[0]?.trash.map((e) => [e.id, e.day, e.position]), [['e1', D1, 0]]);
});

test('chuyến cũ chưa có trường trash vẫn nạp được (trash rỗng)', () => {
  const t = sample();
  const { trash: _drop, ...legacy } = t;
  assert.deepEqual(sanitizeTripsState({ trips: [legacy] })!.trips[0]?.trash, []);
});

test('agoText: vừa xong, phút, giờ, ngày', () => {
  const now = 10 * 86_400_000;
  assert.equal(agoText(now - 5_000, now), 'vừa xong');
  assert.equal(agoText(now - 5 * 60_000, now), '5 phút trước');
  assert.equal(agoText(now - 3 * 3_600_000, now), '3 giờ trước');
  assert.equal(agoText(now - 2 * 86_400_000, now), '2 ngày trước');
  assert.equal(agoText(now + 1000, now), 'vừa xong', 'đồng hồ lệch về tương lai không âm');
});

test('dời lịch (giữ số ngày) dời luôn ngày cũ của mục trong thùng rác; khôi phục về đúng ngày mới', () => {
  const t = sample();
  const moved = assignDay(t, idOf(t, 'c'), D2);
  const gone = trashItem(moved, idOf(moved, 'c'), 'e1', 1);
  const shifted = editTrip(gone, { name: 'T', startDate: D2, endDate: '2026-11-02', shift: true, confirmDates: false }).trip;
  assert.equal(shifted.trash[0]?.day, '2026-11-02', 'ngày 2 cũ thành ngày 2 mới');
  const r = restoreItem(shifted, 'e1')!;
  assert.equal(r.dayLost, false);
  assert.equal(r.trip.items.find((i) => i.placeId === 'c')?.day, '2026-11-02');
});

test('khôi phục sẽ tạo bản thứ hai của một địa điểm đang có trong chuyến thì bị từ chối, thùng rác giữ nguyên', () => {
  const t = sample();
  const gone = trashItem(t, idOf(t, 'a'), 'e1', 1);
  const again = { ...gone, items: [...gone.items, { ...gone.trash[0]!.item, id: 'moi' }] };
  assert.equal(isDuplicateRestore(again, again.trash[0]!), true);
  assert.equal(restoreItem(again, 'e1'), null);
  assert.equal(again.trash.length, 1);
});

test('thùng rác đầy thì không xóa thêm và không tự xóa vĩnh viễn mục cũ (D19)', () => {
  const t = sample();
  const filler = Array.from({ length: LIMITS.MAX_TRASH }, (_, i) => ({ ...trashItem(t, idOf(t, 'a'), `f${i}`, i).trash[0]!, id: `f${i}` }));
  const full = { ...t, trash: filler };
  assert.equal(trashFull(full), true);
  assert.equal(trashItem(full, idOf(full, 'b'), 'moi', 1), full);
  assert.equal(full.trash.length, LIMITS.MAX_TRASH);
});
