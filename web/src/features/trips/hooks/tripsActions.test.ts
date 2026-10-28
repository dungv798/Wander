import test from 'node:test';
import assert from 'node:assert/strict';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { TripsGateway } from '../api/TripsGateway.ts';
import type { Trip, TripItem, TripsState } from '../model/trip.types.ts';
import { createTripsActions } from './tripsActions.ts';

const item = (id: string, day: string | null, position: number | null, over: Partial<TripItem> = {}): TripItem => ({ id, placeId: null, type: 'food', title: id, day, position, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false, addedBy: null, doneBy: [], ...over });
const D1 = '2026-11-01';
const D2 = '2026-11-02';
const D3 = '2026-11-03';
const trip = (items: TripItem[], over: Partial<Trip> = {}): Trip => ({ id: 't', name: 'A', role: 'organizer', memberCount: 1, selfMemberId: null, destinationId: 'ha-giang', startDate: D1, endDate: D3, datesTentative: false, kind: null, interests: [], styles: [], pace: null, budgetK: null, items, trash: [], createdAt: 1, ...over });

/** Cổng giả: ghi lại lời gọi; `load` trả các chuyến đã đặt sẵn theo thứ tự (cái cuối lặp lại). */
function harness(loads: Trip[], initial: Trip[] = [], failAddItemAt = 0): { readonly actions: ReturnType<typeof createTripsActions>; readonly calls: string[]; readonly store: PersistentStore<TripsState> } {
  const calls: string[] = [];
  let n = 0;
  let adds = 0;
  const log = (name: string, ...args: unknown[]): Promise<void> => {
    calls.push(`${name} ${JSON.stringify(args)}`);
    return Promise.resolve();
  };
  const gateway: TripsGateway = {
    loadAll: () => Promise.resolve(loads),
    load: () => Promise.resolve(loads[Math.min(n++, loads.length - 1)]!),
    create: (input) => log('create', input).then(() => 't'),
    update: (id, p) => log('update', id, p),
    addItem: (id, input) => (++adds === failAddItemAt ? Promise.reject(new Error('lỗi mạng giả')) : log('addItem', id, input.placeId ?? input.title).then(() => 'new')),
    editItem: (id, itemId, c) => log('editItem', id, itemId, c),
    trash: (id, itemId) => log('trash', id, itemId),
    restore: (id, itemId) => log('restore', id, itemId),
    purge: (id, itemId) => log('purge', id, itemId),
    setDone: (id, itemId, d) => log('setDone', id, itemId, d),
    reorderDay: (id, day, ids) => log('reorderDay', id, day, ids),
    schedule: (id, c) => log('schedule', id, c),
    deleteTrip: () => Promise.resolve(), restoreTrip: () => Promise.resolve(), loadDeleted: () => Promise.resolve([]),
  };
  const store = new PersistentStore<TripsState>('x', { trips: initial }, () => null, null);
  return { actions: createTripsActions({ gateway, store }), calls, store };
}

test('tạo chuyến: máy chủ cấp mã, địa điểm được thêm lần lượt theo thứ tự, kho cập nhật bằng bản đọc lại', async () => {
  const h = harness([trip([item('a', null, null)])]);
  const created = await h.actions.create({ name: 'A', destinationId: 'ha-giang', startDate: D1, endDate: D3 }, [{ id: 'p1', category: 'canh' }, { id: 'p2', category: 'am' }]);
  assert.equal(created.id, 't');
  assert.deepEqual(h.calls.map((c) => c.split(' ')[0]), ['create', 'addItem', 'addItem']);
  assert.match(h.calls[1]!, /p1/);
  assert.match(h.calls[2]!, /p2/);
  assert.equal(h.store.getSnapshot().trips.length, 1);
});

test('tạo chuyến mà thêm địa điểm thứ hai lỗi: lỗi được ném ra nhưng chuyến đã tạo vẫn nằm trong kho (khớp máy chủ)', async () => {
  const h = harness([trip([item('a', null, null)])], [], 2);
  await assert.rejects(h.actions.create({ name: 'A', destinationId: 'ha-giang', startDate: D1, endDate: D3 }, [{ id: 'p1', category: 'canh' }, { id: 'p2', category: 'am' }]), /lỗi mạng giả/);
  assert.equal(h.store.getSnapshot().trips.length, 1);
});

test('đổi ngày một mục gửi PATCH day; đánh dấu xong gửi giá trị ngược với hiện tại', async () => {
  const h = harness([trip([item('a', D1, 0, { type: 'task', booking: null })])], [trip([item('a', D1, 0, { type: 'task', booking: null })])]);
  await h.actions.assignDay('t', 'a', D2);
  await h.actions.toggleDone('t', 'a');
  assert.deepEqual(h.calls.map((c) => c.split(' ').slice(0, 1).join()), ['editItem', 'setDone']);
  assert.match(h.calls[0]!, /"day":"2026-11-02"/);
  assert.match(h.calls[1]!, /true/);
});

test('đổi chỗ lên/xuống: gửi thứ tự mới của cả ngày; mục đầu bấm lên thì không gọi gì', async () => {
  const t = trip([item('a', D1, 0), item('b', D1, 1), item('c', D1, 2)]);
  const h = harness([t], [t]);
  await h.actions.moveItem('t', 'b', 'up');
  await h.actions.moveItem('t', 'a', 'up');
  assert.deepEqual(h.calls, [`reorderDay ${JSON.stringify(['t', D1, ['b', 'a', 'c']])}`]);
});

test('sửa chuyến dời lịch (cùng số ngày): một lệnh lịch gồm khoảng ngày mới và ngày mới của từng mục; trả số mục rơi khỏi lịch', async () => {
  const t = trip([item('a', D1, 0), item('b', D2, 0)]);
  const h = harness([{ ...t, startDate: '2026-12-01', endDate: '2026-12-03' }], [t]);
  const result = await h.actions.editTrip('t', { name: 'A', startDate: '2026-12-01', endDate: '2026-12-03', shift: true, confirmDates: false });
  assert.equal(result?.lost, 0);
  assert.equal(h.calls.length, 1);
  assert.match(h.calls[0]!, /"startDate":"2026-12-01"/);
  assert.match(h.calls[0]!, /"itemId":"a","day":"2026-12-01"/);
});

test('sửa chuyến rút ngắn không dời lịch: mục ở ngày bị cắt về "Chưa có ngày" và được đếm; đổi tên gửi PATCH sau lệnh lịch', async () => {
  const t = trip([item('a', D1, 0), item('b', D3, 0)]);
  const h = harness([t], [t]);
  const result = await h.actions.editTrip('t', { name: 'B', startDate: D1, endDate: D2, shift: false, confirmDates: false });
  assert.equal(result?.lost, 1);
  assert.deepEqual(result?.lostIds, ['b']);
  assert.deepEqual(h.calls.map((c) => c.split(' ')[0]), ['schedule', 'update']);
  assert.match(h.calls[0]!, /"itemId":"b","day":null/);
  assert.match(h.calls[1]!, /"name":"B"/);
});

test('khôi phục từ thùng rác: báo dayLost khi ngày cũ không còn (mục về Chưa có ngày)', async () => {
  const gone = item('a', D3, 0);
  const before = trip([], {});
  const withTrash: Trip = { ...before, trash: [{ id: 'a', item: gone, deletedAt: 1, day: D3, position: 0 }] };
  const h = harness([{ ...before, items: [item('a', null, null)] }], [withTrash]);
  assert.deepEqual(await h.actions.restoreItem('t', 'a'), { dayLost: true });
  assert.equal(await h.actions.restoreItem('t', 'zzz'), null);
});

test('hoàn tác: chạy các lệnh ngược theo thứ tự (lịch → khôi phục → xóa → PATCH) rồi đọc lại chuyến', async () => {
  const before = trip([item('a', D1, 0)], { name: 'Cũ' });
  const after = trip([item('a', D2, 0)], { name: 'Mới' });
  const h = harness([after, before], [after]);
  await h.actions.revert(before);
  assert.deepEqual(h.calls.map((c) => c.split(' ')[0]), ['schedule', 'update']);
});

/** Cổng có trạng thái: `setDone`/`reorderDay` đổi dữ liệu thật, `load` trả bản hiện tại (mô phỏng máy chủ để thử hàng đợi). */
function live(t: Trip): { readonly actions: ReturnType<typeof createTripsActions>; readonly calls: string[]; readonly server: { trip: Trip } } {
  const server = { trip: t };
  const calls: string[] = [];
  const noop = (): Promise<void> => Promise.resolve();
  const gateway: TripsGateway = {
    loadAll: () => Promise.resolve([server.trip]),
    load: () => Promise.resolve(structuredClone(server.trip)),
    create: () => Promise.resolve('t'),
    update: noop,
    addItem: () => Promise.resolve('n'),
    editItem: (_id, itemId, c) => {
      calls.push(`editItem ${itemId} ${JSON.stringify(c)}`);
      return Promise.resolve();
    },
    trash: noop,
    restore: noop,
    purge: noop,
    setDone: (_id, itemId, done) => {
      calls.push(`setDone ${done}`);
      server.trip = { ...server.trip, items: server.trip.items.map((i) => (i.id === itemId ? { ...i, done } : i)) };
      return new Promise((r) => setTimeout(r, 5));
    },
    reorderDay: (_id, _day, ids) => {
      calls.push(`reorderDay ${ids.join(',')}`);
      server.trip = { ...server.trip, items: server.trip.items.map((i) => ({ ...i, position: ids.indexOf(i.id) })) };
      return new Promise((r) => setTimeout(r, 5));
    },
    schedule: noop,
    deleteTrip: noop, restoreTrip: noop, loadDeleted: () => Promise.resolve([]),
  };
  const store = new PersistentStore<TripsState>('x', { trips: [t] }, () => null, null);
  return { actions: createTripsActions({ gateway, store }), calls, server };
}

test('sửa mục lấy từ kho địa điểm: KHÔNG gửi tiêu đề rỗng (backend bắt buộc tiêu đề), các trường khác vẫn gửi', async () => {
  const h = harness([trip([item('a', D1, 0, { placeId: 'dinh-vuong' })])], [trip([item('a', D1, 0, { placeId: 'dinh-vuong' })])]);
  await h.actions.updateItem('t', 'a', { title: '', timeOfDay: '10:00', costK: 30 });
  assert.match(h.calls[0]!, /"timeOfDay":"10:00"/);
  assert.doesNotMatch(h.calls[0]!, /title/);
});

test('hai lần bấm tích xong liên tiếp: lần sau đọc trạng thái SAU lần trước (đúp = bật rồi tắt), không gửi hai lần cùng giá trị', async () => {
  const h = live(trip([item('a', D1, 0, { type: 'task', booking: null })]));
  await Promise.all([h.actions.toggleDone('t', 'a'), h.actions.toggleDone('t', 'a')]);
  assert.deepEqual(h.calls, ['setDone true', 'setDone false']);
});

test('hai lần đổi chỗ lên liên tiếp: lần sau tính từ thứ tự mới, mục lên đủ hai bậc', async () => {
  const h = live(trip([item('a', D1, 0), item('b', D1, 1), item('c', D1, 2)]));
  await Promise.all([h.actions.moveItem('t', 'c', 'up'), h.actions.moveItem('t', 'c', 'up')]);
  assert.deepEqual(h.calls, ['reorderDay a,c,b', 'reorderDay c,a,b']);
});

test('hoàn tác khi chuyến đã đổi từ nơi khác: không gửi lệnh nào, báo CONCURRENT_MODIFICATION và kho được cập nhật theo máy chủ', async () => {
  const before = trip([item('a', D1, 0)]);
  const h = live(trip([item('a', D1, 0)]));
  h.server.trip = trip([item('a', D1, 0), item('z', D1, 1)]); // máy khác vừa thêm một mục
  await assert.rejects(h.actions.revert(before), (e: unknown) => (e as { code?: string }).code === 'CONCURRENT_MODIFICATION');
  assert.deepEqual(h.calls, []);
  assert.equal(h.actions.current('t')?.items.length, 2);
});

test('đọc lại lỗi SAU khi thao tác đã thành công thì lỗi được báo (không nuốt); thao tác lỗi thì ném lỗi gốc, không phải lỗi đọc lại', async () => {
  const t = trip([item('a', D1, 0, { type: 'task', booking: null })]);
  let fail = false;
  const gateway = {
    loadAll: () => Promise.resolve([t]), load: () => (fail ? Promise.reject(new Error('mạng rớt khi đọc lại')) : Promise.resolve(t)), create: () => Promise.resolve('t'),
    update: () => Promise.resolve(), addItem: () => Promise.resolve('n'), editItem: () => Promise.resolve(), trash: () => Promise.reject(new Error('xóa lỗi')), restore: () => Promise.resolve(),
    purge: () => Promise.resolve(), setDone: () => Promise.resolve(), reorderDay: () => Promise.resolve(), schedule: () => Promise.resolve(),
    deleteTrip: () => Promise.resolve(), restoreTrip: () => Promise.resolve(), loadDeleted: () => Promise.resolve([]),
  } as TripsGateway;
  const actions = createTripsActions({ gateway, store: new PersistentStore<TripsState>('x', { trips: [t] }, () => null, null) });
  fail = true;
  await assert.rejects(actions.toggleDone('t', 'a'), /mạng rớt khi đọc lại/);
  await assert.rejects(actions.trashItem('t', 'a'), /xóa lỗi/);
});

test('xóa mềm chuyến: gọi API rồi gỡ khỏi kho (KHÔNG đọc lại vì chuyến đã 404); khôi phục đọc lại và đưa về kho đúng thứ tự', async () => {
  const a = trip([item('a', D1, 0)]);
  const calls: string[] = [];
  const gateway = {
    loadAll: () => Promise.resolve([a]), load: () => { calls.push('load'); return Promise.resolve(a); }, create: () => Promise.resolve('t'), update: () => Promise.resolve(),
    addItem: () => Promise.resolve('n'), editItem: () => Promise.resolve(), trash: () => Promise.resolve(), restore: () => Promise.resolve(), purge: () => Promise.resolve(),
    setDone: () => Promise.resolve(), reorderDay: () => Promise.resolve(), schedule: () => Promise.resolve(),
    deleteTrip: () => { calls.push('deleteTrip'); return Promise.resolve(); }, restoreTrip: () => { calls.push('restoreTrip'); return Promise.resolve(); },
  } as unknown as TripsGateway;
  const store = new PersistentStore<TripsState>('x', { trips: [a] }, () => null, null);
  const actions = createTripsActions({ gateway, store });
  await actions.deleteTrip('t');
  assert.deepEqual(calls, ['deleteTrip']);
  assert.equal(store.getSnapshot().trips.length, 0);
  await actions.restoreTrip('t');
  assert.deepEqual(calls, ['deleteTrip', 'restoreTrip', 'load']);
  assert.equal(store.getSnapshot().trips.length, 1);
});
