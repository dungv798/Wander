import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { RatingApi } from './RatingApi.ts';

const ok = { rating: { summary: { average: 4.5, count: 2 }, mine: { stars: 5, comment: null, updatedAt: '2026-11-02T00:00:00.000Z' },
  comments: [{ id: 'c1', stars: 4, comment: 'Ngon', updatedAt: '2026-11-02T00:00:00.000Z', mine: false }] } };

/** An API built on a fake fetch; it records the calls (method, URL, body). */
function api(handler: () => Response): { readonly api: RatingApi; readonly calls: { method: string; url: string; body: unknown }[] } {
  const calls: { method: string; url: string; body: unknown }[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    calls.push({ method: init?.method ?? 'GET', url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return Promise.resolve(handler());
  };
  return { api: new RatingApi(new ApiClient(fetchImpl)), calls };
}

test('đọc rating: đường dẫn mã hóa mã quán, kết quả đúng dạng', async () => {
  const t = api(() => new Response(JSON.stringify(ok)));
  const result = await t.api.view('osm:node/1');
  assert.equal(t.calls[0]?.url, '/api/places/osm%3Anode%2F1/rating');
  assert.equal(result.summary.average, 4.5);
  assert.equal(result.mine?.stars, 5);
  assert.equal(result.comments[0]?.mine, false);
});

test('chấm điểm: lời bình rỗng thì không gửi trường comment', async () => {
  const t = api(() => new Response(JSON.stringify(ok)));
  await t.api.rate('p1', 4, '   ');
  await t.api.rate('p1', 5, 'Ngon');
  assert.deepEqual(t.calls[0]?.body, { stars: 4 });
  assert.deepEqual(t.calls[1]?.body, { stars: 5, comment: 'Ngon' });
  assert.equal(t.calls[0]?.method, 'PUT');
});

test('phản hồi sai dạng là lỗi INTERNAL, không phải dữ liệu giả', async () => {
  const t = api(() => new Response(JSON.stringify({ rating: { summary: { average: 'x', count: 1 }, comments: [] } })));
  await assert.rejects(t.api.view('p1'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
});

test('báo cáo trả 204 và dùng đúng đường dẫn', async () => {
  const t = api(() => new Response(null, { status: 204 }));
  await t.api.report('p1', 'abc');
  assert.equal(t.calls[0]?.url, '/api/places/p1/ratings/abc/report');
  assert.equal(t.calls[0]?.method, 'POST');
});
