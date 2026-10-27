import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeLoaded, sortTrips } from './tripOrder.ts';
import type { Trip } from './trip.types.ts';

const trip = (id: string, startDate: string, createdAt: number, name = id): Trip => ({ id, name, destinationId: 'd', startDate, endDate: startDate, datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: null, items: [], trash: [], createdAt });

test('sắp xếp như máy chủ: ngày đi mới nhất trước, bằng nhau thì tạo sau trước', () => {
  const list = [trip('a', '2026-11-01', 1), trip('b', '2026-12-01', 1), trip('c', '2026-11-01', 2)];
  assert.deepEqual(sortTrips(list).map((t) => t.id), ['b', 'c', 'a']);
});

test('hợp nhất bản nạp danh sách với thao tác ghi xen giữa: chuyến vừa đổi giữ bản mới, chuyến mới tạo không mất, phần còn lại lấy từ bản nạp', () => {
  const old1 = trip('1', '2026-11-01', 1, 'cũ');
  const started = { trips: [old1] };
  const refreshed1 = { ...old1, name: 'đã sửa' };
  const created = trip('2', '2026-12-01', 2);
  const current = { trips: [refreshed1, created] };
  const loaded = [{ ...old1, name: 'bản nạp cũ' }, trip('3', '2026-10-01', 3)];
  const merged = mergeLoaded(started, current, loaded);
  assert.deepEqual(merged.map((t) => [t.id, t.name]), [['2', '2'], ['1', 'đã sửa'], ['3', '3']]);
});

test('không có ghi xen giữa: bản nạp được dùng nguyên (đã sắp xếp)', () => {
  const s = { trips: [trip('1', '2026-11-01', 1)] };
  const loaded = [trip('x', '2026-10-01', 1), trip('y', '2026-11-05', 1)];
  assert.deepEqual(mergeLoaded(s, s, loaded).map((t) => t.id), ['y', 'x']);
});

test('chuyến bị xóa phía máy chủ (không còn trong bản nạp) và không phải mới tạo thì biến mất', () => {
  const s = { trips: [trip('gone', '2026-11-01', 1)] };
  assert.deepEqual(mergeLoaded(s, s, []).map((t) => t.id), []);
});
