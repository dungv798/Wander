import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HttpTripsGateway } from './HttpTripsGateway.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });
const VIEW = { id: 't1', name: 'A', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-02', createdAt: '2026-10-27T01:00:00Z' };
const ITEM = { id: 'i1', placeId: null, type: 'food', title: 'Phở', day: '2026-11-01', position: 0, costK: 50, included: false, referenceK: null, booking: 'pending', done: false };

test('PATCH bìa cộng thêm: giữ đối tượng và null; không gửi khóa khi bỏ qua', async () => {
  const g = gateway(() => json({ trip: VIEW }));
  await g.gw.update('t1', { cover: { kind: 'gradient', ref: 'cover-1' } });
  await g.gw.update('t1', { cover: null });
  await g.gw.update('t1', { name: 'Tên mới' });
  assert.deepEqual(g.calls.map(c => c.body), [{ cover: { kind: 'gradient', ref: 'cover-1' } }, { cover: null }, { name: 'Tên mới' }]);
});

/** A gateway built on a fake fetch; `handler` returns the response for each call, `calls` is used to check the path/body. */
function gateway(handler: (c: Call) => Response): { readonly gw: HttpTripsGateway; readonly calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    const call = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return Promise.resolve(handler(call));
  };
  return { gw: new HttpTripsGateway(new ApiClient(fetchImpl)), calls };
}

/** A fake server for reading: the list has one trip, the detail has one item, the trash has one deleted item. */
function reader(c: Call): Response {
  if (c.url === '/api/trips') return json({ trips: [VIEW] });
  if (c.url === '/api/trips/t1') return json({ trip: VIEW, days: [{ date: '2026-11-01', items: [ITEM] }], unscheduled: [] });
  if (c.url === '/api/trips/t1/trash') return json({ items: [{ ...ITEM, id: 'i2', deletedAt: '2026-10-27T03:00:00Z' }] });
  return json({}, 404);
}

test('nạp tất cả: danh sách rồi chi tiết + thùng rác từng chuyến, ghép thành Trip', async () => {
  const g = gateway(reader);
  const trips = await g.gw.loadAll();
  assert.equal(trips.length, 1);
  assert.equal(trips[0]?.items[0]?.id, 'i1');
  assert.equal(trips[0]?.trash[0]?.id, 'i2');
  assert.deepEqual(g.calls.map((c) => c.url).sort(), ['/api/trips', '/api/trips/t1', '/api/trips/t1/trash']);
});

test('phản hồi hỏng thành INTERNAL; chuyến bị xóa giữa chừng thì bỏ qua, lỗi khác không bị nuốt', async () => {
  await assert.rejects(gateway(() => json({ nope: 1 })).gw.loadAll(), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
  // a trip that was just deleted on another device (404 when reading the detail) is skipped, other errors are still reported
  assert.deepEqual(await gateway((c) => (c.url === '/api/trips' ? json({ trips: [VIEW] }) : json({ code: 'NOT_FOUND' }, 404))).gw.loadAll(), []);
  await assert.rejects(gateway((c) => (c.url === '/api/trips' ? json({ trips: [VIEW] }) : json({ code: 'INTERNAL' }, 500))).gw.loadAll(), (e: unknown) => e instanceof ApiError && e.status === 500);
});

test('tạo chuyến: ánh xạ tên trường (destination, budget) và trả mã chuyến mới', async () => {
  const g = gateway((c) => (c.method === 'POST' ? json({ trip: VIEW }, 201) : json({}, 404)));
  const id = await g.gw.create({ name: 'A', destinationId: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-02', budgetK: 3000, kind: 'friends', interests: ['canh'], styles: ['explore'], pace: 'moderate', datesTentative: true });
  assert.equal(id, 't1');
  assert.deepEqual(g.calls[0], { url: '/api/trips', method: 'POST', body: { name: 'A', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-02', budget: 3000, kind: 'friends', interests: ['canh'], styles: ['explore'], pace: 'moderate', datesTentative: true } });
});

test('sửa chuyến: chỉ gửi trường được nêu (không nêu = giữ nguyên)', async () => {
  const g = gateway(() => json({ trip: VIEW }));
  await g.gw.update('t1', { name: 'B', datesTentative: false });
  assert.deepEqual(g.calls[0], { url: '/api/trips/t1', method: 'PATCH', body: { name: 'B', datesTentative: false } });
});

test('thêm mục: ánh xạ costK→cost, referenceK→referenceCost và trả mã mục', async () => {
  const g = gateway(() => json({ item: ITEM }, 201));
  const id = await g.gw.addItem('t1', { type: 'food', title: 'Phở', day: '2026-11-01', placeId: null, costK: 50, included: false, referenceK: null, booking: 'pending', timeOfDay: null, durationMin: null, note: '' });
  assert.equal(id, 'i1');
  assert.deepEqual(g.calls[0]?.body, { type: 'food', title: 'Phở', day: '2026-11-01', placeId: null, cost: 50, included: false, referenceCost: null, booking: 'pending', timeOfDay: null, durationMin: null, note: '' });
});

test('sửa mục: chỉ trường nêu; chi phí trống (null) vẫn được gửi để xóa giá', async () => {
  const g = gateway(() => json({ item: ITEM }));
  await g.gw.editItem('t1', 'i1', { costK: null, note: 'x' });
  assert.deepEqual(g.calls[0], { url: '/api/trips/t1/items/i1', method: 'PATCH', body: { cost: null, note: 'x' } });
});

test('xóa mềm, khôi phục, xóa vĩnh viễn, đánh dấu xong, xếp lại ngày, lịch nguyên tử: đúng đường dẫn và thân', async () => {
  const g = gateway((c) => (c.url.endsWith('/permanent') ? new Response(null, { status: 204 }) : json({ item: ITEM, items: [], trip: VIEW })));
  await g.gw.trash('t1', 'i1');
  await g.gw.restore('t1', 'i1');
  await g.gw.purge('t1', 'i1');
  await g.gw.setDone('t1', 'i1', true);
  await g.gw.reorderDay('t1', '2026-11-01', ['b', 'a']);
  await g.gw.schedule('t1', { startDate: '2026-11-02', assignments: [{ itemId: 'a', day: null }, { itemId: 'b', day: '2026-11-02', position: 0 }] });
  assert.deepEqual(g.calls, [
    { url: '/api/trips/t1/items/i1', method: 'DELETE', body: undefined },
    { url: '/api/trips/t1/items/i1/restore', method: 'POST', body: undefined },
    { url: '/api/trips/t1/items/i1/permanent', method: 'DELETE', body: undefined },
    { url: '/api/trips/t1/items/i1/done', method: 'PUT', body: { done: true } },
    { url: '/api/trips/t1/days/2026-11-01/reorder', method: 'POST', body: { orderedIds: ['b', 'a'] } },
    { url: '/api/trips/t1/schedule', method: 'POST', body: { startDate: '2026-11-02', assignments: [{ itemId: 'a', day: null }, { itemId: 'b', day: '2026-11-02', position: 0 }] } },
  ]);
});

test('xóa mềm và khôi phục cả chuyến: đúng đường dẫn; danh sách chuyến đã xóa ánh xạ tên, ngày và thời điểm xóa', async () => {
  const g = gateway((c) => {
    if (c.method === 'DELETE') return new Response(null, { status: 204 });
    if (c.url === '/api/trips/deleted') return json({ trips: [{ trip: VIEW, deletedAt: '2026-10-28T01:00:00Z' }, { trip: null, deletedAt: 'x' }] });
    return json({ trip: VIEW });
  });
  await g.gw.deleteTrip('t1');
  await g.gw.restoreTrip('t1');
  assert.deepEqual(g.calls.map((c) => `${c.method} ${c.url}`), ['DELETE /api/trips/t1', 'POST /api/trips/t1/restore']);
  assert.deepEqual(await g.gw.loadDeleted(), [{ id: 't1', name: 'A', destinationId: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-02', deletedAt: Date.parse('2026-10-28T01:00:00Z') }]);
  await assert.rejects(gateway(() => json({ nope: 1 })).gw.loadDeleted(), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
});
