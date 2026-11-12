import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './ApiError.ts';
import { ApiClient } from './ApiClient.ts';
import type { FetchLike } from './ApiClient.ts';

/** Fetch giả ghi lại lời gọi và trả phản hồi định sẵn. */
function fakeFetch(res: () => Response | Promise<Response>): { readonly fetchImpl: FetchLike; readonly calls: { url: string; init: RequestInit | undefined }[] } {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  return {
    calls,
    fetchImpl: (url, init) => {
      calls.push({ url, init });
      return Promise.resolve(res());
    },
  };
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const headersOf = (init: RequestInit | undefined): Record<string, string> => (init?.headers ?? {}) as Record<string, string>;

test('GET thành công: trả JSON đã phân tích, gửi method GET và Accept JSON, truyền tín hiệu hủy', async () => {
  const f = fakeFetch(() => json({ ok: 1 }));
  const abort = new AbortController();
  const out = await new ApiClient(f.fetchImpl).get<{ ok: number }>('/api/x', abort.signal);
  assert.deepEqual(out, { ok: 1 });
  assert.equal(f.calls[0]?.url, '/api/x');
  assert.equal(f.calls[0]?.init?.method, 'GET');
  assert.equal(headersOf(f.calls[0]?.init)['Accept'], 'application/json');
  assert.equal(f.calls[0]?.init?.signal, abort.signal);
});

test('lỗi có thân {error:{code}} thành ApiError mang đúng mã và mã HTTP; không lộ lời báo thô', async () => {
  const f = fakeFetch(() => json({ error: { code: 'RATE_LIMITED', message: 'chi tiết nội bộ' } }, 429));
  await assert.rejects(new ApiClient(f.fetchImpl).get('/api/x'), (e: unknown) => {
    assert.ok(e instanceof ApiError);
    assert.equal(e.code, 'RATE_LIMITED');
    assert.equal(e.status, 429);
    assert.doesNotMatch(e.message, /nội bộ/);
    return true;
  });
});

test('lỗi không có thân JSON hợp lệ (cổng proxy trả HTML) thành INTERNAL, giữ mã HTTP', async () => {
  const f = fakeFetch(() => new Response('<html>502</html>', { status: 502 }));
  await assert.rejects(new ApiClient(f.fetchImpl).get('/api/x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL' && e.status === 502);
});

test('mất kết nối (fetch ném) thành NETWORK; hủy bằng AbortSignal được ném lại nguyên dạng, không thành lỗi mạng', async () => {
  const down = new ApiClient(() => Promise.reject(new TypeError('Failed to fetch')));
  await assert.rejects(down.get('/api/x'), (e: unknown) => e instanceof ApiError && e.isNetwork);

  const aborted = new ApiClient(() => Promise.reject(new DOMException('aborted', 'AbortError')));
  await assert.rejects(aborted.get('/api/x'), (e: unknown) => e instanceof DOMException && e.name === 'AbortError');
});

test('200 nhưng thân không phải JSON thành INTERNAL; 204 trả undefined', async () => {
  const bad = fakeFetch(() => new Response('không phải json', { status: 200 }));
  await assert.rejects(new ApiClient(bad.fetchImpl).get('/api/x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');

  const empty = fakeFetch(() => new Response(null, { status: 204 }));
  assert.equal(await new ApiClient(empty.fetchImpl).send('DELETE', '/api/x'), undefined);
});

test('gửi JSON: đặt Content-Type và thân đã mã hóa; tiêu đề bổ sung (Bearer) lấy mới ở mỗi lời gọi', async () => {
  let token = 'a';
  const f = fakeFetch(() => json({}));
  const client = new ApiClient(f.fetchImpl, () => ({ Authorization: `Bearer ${token}` }));
  await client.send('POST', '/api/x', { n: 1 });
  token = 'b';
  await client.send('PATCH', '/api/y', { m: 2 });

  const first = f.calls[0]?.init;
  assert.equal(first?.method, 'POST');
  assert.equal(first?.body, '{"n":1}');
  assert.equal(headersOf(first)['Content-Type'], 'application/json');
  assert.equal(headersOf(first)['Authorization'], 'Bearer a');
  assert.equal(headersOf(f.calls[1]?.init)['Authorization'], 'Bearer b');
});

test('hủy giữa lúc đọc thân (res.json ném AbortError) được ném lại nguyên dạng, không thành INTERNAL', async () => {
  const res = { ok: true, status: 200, json: () => Promise.reject(new DOMException('aborted', 'AbortError')) } as unknown as Response;
  await assert.rejects(new ApiClient(() => Promise.resolve(res)).get('/api/x'), (e: unknown) => e instanceof DOMException && e.name === 'AbortError');

  const errBody = { ok: false, status: 500, json: () => Promise.reject(new DOMException('aborted', 'AbortError')) } as unknown as Response;
  await assert.rejects(new ApiClient(() => Promise.resolve(errBody)).get('/api/x'), (e: unknown) => e instanceof DOMException && e.name === 'AbortError');
});

test('hủy bằng abort(lý do): fetch ném chính lý do, vẫn được ném lại và không thành NETWORK', async () => {
  const abort = new AbortController();
  const reason = new Error('người dùng rời trang');
  abort.abort(reason);
  const client = new ApiClient(() => Promise.reject(reason));
  await assert.rejects(client.get('/api/x', abort.signal), (e: unknown) => e === reason);
});

test('thân lỗi sai hình dạng (code không phải chuỗi, rỗng, error null) hoặc 5xx có thân JSON không mã đều thành INTERNAL', async () => {
  for (const body of [{ error: { code: 123 } }, { error: { code: '' } }, { error: null }, { khac: 1 }, null]) {
    const f = fakeFetch(() => json(body, 503));
    await assert.rejects(new ApiClient(f.fetchImpl).get('/api/x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL' && e.status === 503);
  }
});

test('bộ theo dõi lời gọi: mỗi lời gọi được báo bắt đầu và kết thúc đúng một lần, kể cả khi lỗi mạng, lỗi HTTP hay bị hủy', async () => {
  const events: string[] = [];
  const tracker = { begin: () => { events.push('begin'); return () => { events.push('end'); }; } };
  const ok = new ApiClient(fakeFetch(() => json({ ok: 1 })).fetchImpl, undefined, tracker);
  await ok.get('/api/x');
  assert.deepEqual(events, ['begin', 'end']);
  events.length = 0;
  await assert.rejects(new ApiClient(fakeFetch(() => json({ error: { code: 'NOT_FOUND' } }, 404)).fetchImpl, undefined, tracker).get('/api/x'));
  await assert.rejects(new ApiClient(() => Promise.reject(new TypeError('offline')), undefined, tracker).get('/api/x'));
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(new ApiClient(() => Promise.reject(new Error('x')), undefined, tracker).get('/api/x', abort.signal));
  assert.deepEqual(events, ['begin', 'end', 'begin', 'end', 'begin', 'end']);
});
