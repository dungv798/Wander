import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { HttpPreferencesGateway } from './HttpPreferencesGateway.ts';

interface Call {
  readonly url: string;
  readonly method: string;
  readonly body: unknown;
}

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

/** Cổng dựng trên fetch giả; `calls` để kiểm đường dẫn/thân. */
function gateway(handler: (c: Call) => Response): { readonly gw: HttpPreferencesGateway; readonly calls: Call[] } {
  const calls: Call[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    const call = { url, method: init?.method ?? 'GET', body: init?.body ? JSON.parse(String(init.body)) : undefined };
    calls.push(call);
    return Promise.resolve(handler(call));
  };
  return { gw: new HttpPreferencesGateway(new ApiClient(fetchImpl)), calls };
}

test('đọc sở thích: lấy mã từ mảng {code,label}, bỏ phần tử hỏng', async () => {
  const g = gateway(() => json({ interests: [{ code: 'canh', label: 'Cảnh quan' }, { code: 5 }, null, { code: 'am', label: 'Ẩm thực' }] }));
  assert.deepEqual(await g.gw.interests(), ['canh', 'am']);
  assert.deepEqual(g.calls[0], { url: '/api/preferences', method: 'GET', body: undefined });
});

test('lưu sở thích: PUT danh sách mã (thay thế toàn bộ) và trả danh sách máy chủ đã chuẩn hóa', async () => {
  const g = gateway(() => json({ interests: [{ code: 'canh', label: 'x' }] }));
  assert.deepEqual(await g.gw.saveInterests(['canh', 'canh']), ['canh']);
  assert.deepEqual(g.calls[0], { url: '/api/preferences/interests', method: 'PUT', body: { interests: ['canh', 'canh'] } });
});

test('phản hồi sai dạng thành INTERNAL; lỗi máy chủ giữ mã lỗi', async () => {
  await assert.rejects(gateway(() => json({ nope: 1 })).gw.interests(), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
  await assert.rejects(gateway(() => json({ error: { code: 'INVALID_INTEREST' } }, 400)).gw.saveInterests(['x']), (e: unknown) => e instanceof ApiError && e.code === 'INVALID_INTEREST');
});
