import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HttpIdentityGateway } from './HttpIdentityGateway.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });
const err = (code: string, status: number): Response => json({ error: { code } }, status);

/** Cổng dựng trên fetch giả: `handler` nhận từng lời gọi và trả phản hồi; trả thêm danh sách lời gọi để kiểm. */
function gateway(handler: (c: Call) => Response): { readonly gw: HttpIdentityGateway; readonly calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    const call = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return Promise.resolve(handler(call));
  };
  return { gw: new HttpIdentityGateway(new ApiClient(fetchImpl), 'Máy này'), calls };
}

test('tạo danh tính: gửi tên máy, bỏ qua mã (mã tạo ở bước sau) và trả bí mật phiên', async () => {
  const g = gateway(() => json({ identityId: 'i', token: 'T'.repeat(43), recoveryCode: null }, 201));
  assert.equal(await g.gw.createIdentity('iPhone'), 'T'.repeat(43));
  assert.deepEqual(g.calls[0], { url: '/api/identity', method: 'POST', body: { skipRecoveryCode: true, deviceName: 'iPhone' } });
  await assert.rejects(gateway(() => json({})).gw.createIdentity('x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
});

test('ảnh chụp: gọi ba API song song và ghép; phản hồi hỏng thành INTERNAL; 401 giữ nguyên để báo hết phiên', async () => {
  const g = gateway((c) => {
    if (c.url === '/api/sessions') return json({ sessions: [{ id: 's', current: true, deviceName: 'A', lastSeenAt: '2026-10-27T00:00:00Z' }] });
    if (c.url === '/api/events') return json({ events: [], unseen: false });
    return json({ hasCode: true });
  });
  const s = await g.gw.snapshot();
  assert.equal(s.devices[0]?.current, true);
  assert.equal(s.hasCode, true);
  assert.deepEqual(g.calls.map((c) => c.url).sort(), ['/api/events', '/api/recovery-code', '/api/sessions']);

  await assert.rejects(gateway(() => json({})).gw.snapshot(), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
  await assert.rejects(gateway(() => err('UNAUTHENTICATED', 401)).gw.snapshot(), (e: unknown) => e instanceof ApiError && e.code === 'UNAUTHENTICATED' && e.status === 401);
});

test('đổi tên, thu hồi, đánh dấu đã xem: đúng phương thức và đường dẫn (mã thiết bị được mã hóa)', async () => {
  const g = gateway(() => new Response(null, { status: 204 }));
  await g.gw.rename('Máy bàn');
  await g.gw.revoke('a/b');
  await g.gw.markSeen();
  assert.deepEqual(g.calls.map((c) => `${c.method} ${c.url}`), ['PATCH /api/sessions/current', 'DELETE /api/sessions/a%2Fb', 'POST /api/events/seen']);
  assert.deepEqual(g.calls[0]?.body, { deviceName: 'Máy bàn' });
});

test('mã khôi phục mới: pha 1 không bằng chứng gửi thân rỗng, có bằng chứng gửi evidence; pha 2 gửi mã đầy đủ', async () => {
  const g = gateway(() => json({ pendingId: 'p1', replacementCode: '7K2QF-9X3MP-A45TR-8VWB6-NCD1G-HJ0ZE', expiresAt: '2026-10-27T01:15:00Z' }));
  const first = await g.gw.beginReplacement();
  assert.deepEqual(g.calls[0]?.body, {});
  assert.equal(first.pendingId, 'p1');
  assert.equal(first.code, '7K2QF-9X3MP-A45TR-8VWB6-NCD1G-HJ0ZE');
  assert.equal(first.expiresAt, Date.parse('2026-10-27T01:15:00Z'));

  await g.gw.beginReplacement({ type: 'code', code: 'ABC' });
  assert.deepEqual(g.calls[1]?.body, { evidence: { type: 'code', code: 'ABC' } });
  await g.gw.beginReplacement({ type: 'approval', requestId: 'r' });
  assert.deepEqual(g.calls[2]?.body, { evidence: { type: 'approval', requestId: 'r' } });

  await g.gw.confirmReplacement('p1', first.code);
  assert.deepEqual(g.calls[3], { url: '/api/recovery-code/confirm', method: 'POST', body: { pendingId: 'p1', replacementCode: first.code } });
});

test('khôi phục trên máy mới và ghép máy: gửi đúng thân; trả mã/số do máy chủ cấp; trạng thái lạ là phản hồi hỏng', async () => {
  const g = gateway((c) => {
    if (c.url === '/api/recovery/start') return json({ attemptId: 'a', replacementCode: 'CODE', expiresAt: '2026-10-27T01:15:00Z' });
    if (c.url === '/api/device-links' && c.method === 'POST') return json({ requestId: 'r1', pairingCode: 'ABCD-EFGH', matchNumber: 42, expiresAt: '2026-10-27T01:05:00Z' }, 201);
    if (c.url === '/api/device-links/r1') return json({ status: 'approved' });
    return json({ status: 'la' });
  });
  const started = await g.gw.startRecovery('MA', 'att', 'T'.repeat(43), 'Máy mới');
  assert.deepEqual(g.calls[0]?.body, { code: 'MA', attemptId: 'att', sessionToken: 'T'.repeat(43), deviceName: 'Máy mới' });
  assert.equal(started.code, 'CODE');
  await g.gw.completeRecovery('att', 'CODE');
  assert.deepEqual(g.calls[1], { url: '/api/recovery/complete', method: 'POST', body: { attemptId: 'att', replacementCode: 'CODE' } });

  const link = await g.gw.createLink('T'.repeat(43), 'Laptop');
  assert.equal(link.number, 42);
  assert.equal(link.pairingCode, 'ABCD-EFGH');
  assert.equal(await g.gw.linkStatus('r1'), 'approved');
  await assert.rejects(g.gw.linkStatus('x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
});

test('xem trước: thử ghép máy trước, rồi xác thực lại; sai ở cả hai chỉ báo MỘT mã chung (không lộ loại)', async () => {
  const link = gateway((c) => (c.url === '/api/device-links/preview' ? json({ requestId: 'r', deviceName: 'Laptop', createdAt: '2026-10-27T01:00:00Z', options: [11, 42, 77] }) : err('X', 500)));
  const p = await link.gw.preview('ABCDEFGH');
  assert.equal(p.kind, 'link');
  assert.equal(p.deviceName, 'Laptop');
  assert.deepEqual(p.options, [11, 42, 77]);
  assert.deepEqual(link.calls[0]?.body, { pairingCode: 'ABCDEFGH' });

  const stepUp = gateway((c) => (c.url === '/api/device-links/preview'
    ? err('INVALID_PAIRING_CODE', 400)
    : json({ requestId: 's', operation: 'regenerate_code', requesterDeviceName: null, createdAt: '2026-10-27T01:00:00Z', options: [10, 20, 30] })));
  const s = await stepUp.gw.preview('ABCDEFGH');
  assert.equal(s.kind, 'stepUp');
  assert.equal(s.deviceName, null);
  assert.deepEqual(stepUp.calls.map((c) => c.url), ['/api/device-links/preview', '/api/step-up/preview']);

  const none = gateway((c) => (c.url === '/api/device-links/preview' ? err('INVALID_PAIRING_CODE', 400) : err('INVALID_APPROVAL_CODE', 400)));
  await assert.rejects(none.gw.preview('X'), (e: unknown) => e instanceof ApiError && e.code === 'INVALID_PAIRING_CODE');

  await assert.rejects(gateway(() => err('UNAUTHENTICATED', 401)).gw.preview('X'), (e: unknown) => e instanceof ApiError && e.status === 401);
});

test('trả lời bằng số khớp: đúng thì approved, chọn sai (403 MATCH_MISMATCH) thì wrong, lỗi khác ném nguyên; từ chối đúng đường dẫn', async () => {
  const preview = { kind: 'link' as const, code: 'ABCD-EFGH', deviceName: 'L', createdAt: 0, options: [1, 2, 3] };
  const ok = gateway(() => json({ approved: true }));
  assert.equal(await ok.gw.answer(preview, 42), 'approved');
  assert.deepEqual(ok.calls[0], { url: '/api/device-links/approve', method: 'POST', body: { pairingCode: 'ABCD-EFGH', number: 42 } });

  assert.equal(await gateway(() => err('MATCH_MISMATCH', 403)).gw.answer(preview, 11), 'wrong');
  await assert.rejects(gateway(() => err('INVALID_PAIRING_CODE', 400)).gw.answer(preview, 11), (e: unknown) => e instanceof ApiError && e.code === 'INVALID_PAIRING_CODE');

  const step = gateway(() => json({ approved: true }));
  await step.gw.answer({ ...preview, kind: 'stepUp' }, 7);
  await step.gw.deny({ ...preview, kind: 'stepUp' });
  await ok.gw.deny(preview);
  assert.deepEqual(step.calls.map((c) => c.url), ['/api/step-up/approve', '/api/step-up/deny']);
  assert.deepEqual(step.calls[0]?.body, { approvalCode: 'ABCD-EFGH', number: 7 });
  assert.equal(ok.calls[1]?.url, '/api/device-links/deny');
});

test('xin phê duyệt xác thực lại: gửi thao tác tạo lại mã và trả mã duyệt + số khớp', async () => {
  const g = gateway(() => json({ requestId: 'q', approvalCode: 'WXYZ-1234', matchNumber: 58, expiresAt: '2026-10-27T01:05:00Z' }, 201));
  const r = await g.gw.requestStepUp();
  assert.deepEqual(g.calls[0], { url: '/api/step-up/requests', method: 'POST', body: { operation: 'regenerate_code' } });
  assert.deepEqual([r.requestId, r.approvalCode, r.number], ['q', 'WXYZ-1234', 58]);
});
test('poll truyền AbortSignal tới fetch và giữ nguyên lỗi hủy', async () => {
  const abort = new AbortController();
  const reason = new DOMException('cancelled', 'AbortError');
  const client = new ApiClient((_url, init) => {
    assert.equal(init?.signal, abort.signal);
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(reason));
    });
  });
  const pending = new HttpIdentityGateway(client, 'Máy này').linkStatus('request', abort.signal);
  abort.abort();
  await assert.rejects(pending, error => error === reason);
});
