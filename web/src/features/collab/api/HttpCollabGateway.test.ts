import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HttpCollabGateway } from './HttpCollabGateway.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

/** A gateway built on a fake fetch; `calls` is used to check the path and the body. */
function gateway(handler: (c: Call) => Response): { readonly gw: HttpCollabGateway; readonly calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    const call = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return Promise.resolve(handler(call));
  };
  return { gw: new HttpCollabGateway(new ApiClient(fetchImpl)), calls };
}

const MEMBER = { id: 'm1', displayName: 'An', role: 'member', joinedAt: '2026-10-28T01:00:00Z', self: true };

test('thành viên: ánh xạ vai, thời điểm vào, đánh dấu chính mình; phần tử hỏng bị bỏ', async () => {
  const g = gateway(() => json({ members: [MEMBER, { id: 5 }, { ...MEMBER, id: 'm2', role: 'ufo' }] }));
  const list = await g.gw.members('t1');
  assert.deepEqual(list, [{ id: 'm1', displayName: 'An', role: 'member', joinedAt: Date.parse('2026-10-28T01:00:00Z'), self: true }]);
  assert.equal(g.calls[0]?.url, '/api/trips/t1/members');
  await assert.rejects(gateway(() => json({})).gw.members('t1'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
});

test('liên kết mời: tạo trả mã một lần; trạng thái không có mã; chưa có liên kết là null; thu hồi gọi DELETE', async () => {
  const g = gateway((c) => (c.method === 'POST' ? json({ invite: { id: 'i1', code: 'C'.repeat(43), expiresAt: '2026-11-04T00:00:00Z' } }, 201) : c.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ invite: null })));
  assert.deepEqual(await g.gw.createInvite('t1'), { id: 'i1', code: 'C'.repeat(43), expiresAt: Date.parse('2026-11-04T00:00:00Z') });
  assert.equal(await g.gw.invite('t1'), null);
  await g.gw.revokeInvite('t1');
  assert.deepEqual(g.calls.map((c) => `${c.method} ${c.url}`), ['POST /api/trips/t1/invites', 'GET /api/trips/t1/invites', 'DELETE /api/trips/t1/invites/active']);
});

test('xem trước và vào chuyến: gửi mã và tên, trả tên chuyến / mã chuyến + thành viên', async () => {
  const g = gateway((c) => (c.url.endsWith('/preview') ? json({ invite: { tripName: 'Đà Lạt', memberCount: 2 } }) : json({ tripId: 't9', member: MEMBER }, 201)));
  assert.deepEqual(await g.gw.preview('X'.repeat(43)), { tripName: 'Đà Lạt', memberCount: 2 });
  const joined = await g.gw.join('X'.repeat(43), 'An');
  assert.equal(joined.tripId, 't9');
  assert.equal(joined.member.displayName, 'An');
  assert.deepEqual(g.calls[1]?.body, { code: 'X'.repeat(43), displayName: 'An' });
});

test('gỡ thành viên, rời chuyến, đổi tên mình: đúng đường dẫn', async () => {
  const g = gateway((c) => (c.method === 'DELETE' ? new Response(null, { status: 204 }) : json({ member: MEMBER })));
  await g.gw.removeMember('t1', 'm2');
  await g.gw.leave('t1');
  const renamed = await g.gw.rename('t1', 'An Mới');
  assert.equal(renamed.self, true);
  assert.deepEqual(g.calls.map((c) => `${c.method} ${c.url}`), ['DELETE /api/trips/t1/members/m2', 'DELETE /api/trips/t1/members/me', 'PATCH /api/trips/t1/members/me']);
  assert.deepEqual(g.calls[2]?.body, { displayName: 'An Mới' });
});

test('đề nghị xóa: danh sách ánh xạ trạng thái; gửi/hủy/đồng ý/từ chối đúng đường dẫn', async () => {
  const req = { id: 'r1', itemId: 'i1', requesterId: 'm2', requesterName: null, reason: '', status: 'pending', requestedAt: '2026-10-28T01:00:00Z', decidedAt: null };
  const g = gateway((c) => (c.method === 'DELETE' ? new Response(null, { status: 204 }) : c.method === 'GET' ? json({ requests: [req, { ...req, id: 'r2', status: 'weird' }] }) : json({ request: req }, 201)));
  const list = await g.gw.requests('t1');
  assert.equal(list.length, 1);
  assert.equal(list[0]?.requesterName, null);
  await g.gw.submitRequest('t1', 'i1', 'hết chỗ');
  await g.gw.cancelRequest('t1', 'r1');
  await g.gw.approveRequest('t1', 'r1');
  await g.gw.rejectRequest('t1', 'r1');
  assert.deepEqual(g.calls.slice(1).map((c) => `${c.method} ${c.url}`), ['POST /api/trips/t1/deletion-requests', 'DELETE /api/trips/t1/deletion-requests/r1', 'POST /api/trips/t1/deletion-requests/r1/approve', 'POST /api/trips/t1/deletion-requests/r1/reject']);
  assert.deepEqual(g.calls[1]?.body, { itemId: 'i1', reason: 'hết chỗ' });
});

test('checklist: ánh xạ hạng mục; thêm/sửa/xóa/tick đúng đường dẫn và thân', async () => {
  const item = { id: 'c1', group: 'Giấy tờ', title: 'CCCD', position: 0, done: true, doneBy: ['m1'] };
  const g = gateway((c) => (c.method === 'DELETE' ? new Response(null, { status: 204 }) : c.method === 'GET' ? json({ items: [item, { id: 7 }] }) : json({ item })));
  assert.deepEqual(await g.gw.checklist('t1'), [item]);
  await g.gw.addChecklist('t1', { group: 'Giấy tờ', title: 'CCCD' });
  await g.gw.editChecklist('t1', 'c1', { title: 'Hộ chiếu' });
  await g.gw.setChecklistDone('t1', 'c1', true);
  await g.gw.removeChecklist('t1', 'c1');
  assert.deepEqual(g.calls.slice(1).map((c) => `${c.method} ${c.url}`), ['POST /api/trips/t1/checklist', 'PATCH /api/trips/t1/checklist/c1', 'PUT /api/trips/t1/checklist/c1/done', 'DELETE /api/trips/t1/checklist/c1']);
  assert.deepEqual(g.calls[3]?.body, { done: true });
});
