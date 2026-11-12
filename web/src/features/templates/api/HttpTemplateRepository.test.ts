import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { HttpTemplateRepository } from './HttpTemplateRepository.ts';

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

/** A repository built on a fake fetch; it also returns the list of URLs that were called. */
function repo(handler: (url: string) => Response): { readonly repository: HttpTemplateRepository; readonly urls: string[] } {
  const urls: string[] = [];
  const fetchImpl: FetchLike = (url) => {
    urls.push(url);
    return Promise.resolve(handler(url));
  };
  return { repository: new HttpTemplateRepository(new ApiClient(fetchImpl)), urls };
}

type RawTemplates = { templates: { id: string; status: string; days: { places: string[]; note: string | null }[] }[] };

test('đổi days[].placeIds của API thành days[].places mà bộ ánh xạ lịch mẫu của giao diện đọc; giữ ghi chú và trạng thái', async () => {
  const r = repo(() => json({
    templates: [{ id: 't1', title: 'Một', summary: 's', status: 'approved', days: [{ placeIds: ['a', 'b'], note: null }, { placeIds: [], note: 'Nghỉ' }] }],
  }));
  const raw = (await r.repository.templates('ha-giang')) as RawTemplates;
  assert.equal(r.urls[0], '/api/catalog/destinations/ha-giang/templates');
  assert.equal(raw.templates[0]?.status, 'approved');
  assert.deepEqual(raw.templates[0]?.days[0]?.places, ['a', 'b']);
  assert.equal(raw.templates[0]?.days[1]?.note, 'Nghỉ');
  assert.equal('placeIds' in (raw.templates[0]?.days[0] ?? {}), false);
});

test('điểm đến chưa có lịch hoặc 404 trả dữ liệu rỗng (không phải lỗi); lỗi khác vẫn ném', async () => {
  assert.deepEqual(await repo(() => json({ templates: [] })).repository.templates('x'), { templates: [] });
  assert.deepEqual(await repo(() => json({ code: 'NOT_FOUND' }, 404)).repository.templates('x'), {});
  await assert.rejects(repo(() => json({ code: 'RATE_LIMITED' }, 429)).repository.templates('x'), (e: unknown) => e instanceof ApiError && e.code === 'RATE_LIMITED');
});

test('thân sai hình dạng thành INTERNAL; phần tử hỏng bị bỏ qua thay vì làm sập danh sách', async () => {
  await assert.rejects(repo(() => json({ templates: 'x' })).repository.templates('x'), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
  const raw = (await repo(() => json({ templates: [null, 5, { id: 't', title: 'T', status: 'draft', days: [{ placeIds: ['a'], note: null }] }] })).repository.templates('x')) as RawTemplates;
  assert.equal(raw.templates.length, 1);
});

test('lịch mẫu được nhớ: gọi lặp chỉ một lần; lỗi không được nhớ; thiếu placeIds thành danh sách rỗng', async () => {
  let fail = true;
  const r = repo(() => (fail ? json({ code: 'INTERNAL' }, 500) : json({ templates: [{ id: 't', title: 'T', status: 'draft', days: [{ note: 'Nghỉ' }] }] })));
  await assert.rejects(r.repository.templates('ha-giang'));
  fail = false;
  const [a, b] = await Promise.all([r.repository.templates('ha-giang'), r.repository.templates('ha-giang')]);
  assert.equal(a, b);
  assert.equal(r.urls.length, 2);
  assert.deepEqual((a as RawTemplates).templates[0]?.days[0]?.places, []);
});
