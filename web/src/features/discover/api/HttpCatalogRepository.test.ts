import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { HttpCatalogRepository } from './HttpCatalogRepository.ts';

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });
const validDestination = (id = 'ha-giang'): Record<string, unknown> => ({ id, name: 'Hà Giang', places: [], guide: [], references: [] });
const validSummary = (id = 'ha-giang'): Record<string, unknown> => ({ id, name: 'Hà Giang', region: 'Đông Bắc' });
const isInternal = (e: unknown): boolean => e instanceof ApiError && e.code === 'INTERNAL';

/** Kho dựng trên fetch giả; trả thêm danh sách lời gọi (URL và tín hiệu hủy). */
function repo(handler: (url: string) => Response | Promise<Response>): {
  readonly repository: HttpCatalogRepository;
  readonly urls: string[];
  readonly signals: (AbortSignal | null | undefined)[];
} {
  const urls: string[] = [];
  const signals: (AbortSignal | null | undefined)[] = [];
  const fetchImpl: FetchLike = (url, init) => {
    urls.push(url);
    signals.push(init?.signal);
    return Promise.resolve(handler(url));
  };
  return { repository: new HttpCatalogRepository(new ApiClient(fetchImpl)), urls, signals };
}

test('tìm điểm đến: gọi /api/catalog/destinations, mã hóa chuỗi tìm; rỗng thì không gửi q; truyền tín hiệu hủy', async () => {
  const r = repo(() => json({ destinations: [validSummary()] }));
  const abort = new AbortController();
  assert.deepEqual(await r.repository.searchDestinations('hà giang', abort.signal), [validSummary()]);
  await r.repository.searchDestinations('');
  await r.repository.searchDestinations('   ');
  assert.deepEqual(r.urls, ['/api/catalog/destinations?q=h%C3%A0%20giang', '/api/catalog/destinations', '/api/catalog/destinations']);
  assert.equal(r.signals[0], abort.signal);
});

test('một điểm đến: gọi theo mã đã mã hóa và lấy trường destination', async () => {
  const r = repo(() => json({ destination: validDestination() }));
  assert.equal((await r.repository.destination('ha-giang')).id, 'ha-giang');
  await r.repository.destination('a/b?c');
  assert.equal(r.urls[1], '/api/catalog/destinations/a%2Fb%3Fc');
});

test('mã lạ: 404 của máy chủ thành ApiError NOT_FOUND để giao diện hiện đúng lời nhắc', async () => {
  const r = repo(() => json({ error: { code: 'NOT_FOUND', message: 'x' } }, 404));
  await assert.rejects(r.repository.destination('khong-co'), (e: unknown) => e instanceof ApiError && e.code === 'NOT_FOUND' && e.status === 404);
});

test('thân sai hình dạng thành INTERNAL, không để lọt giá trị hỏng vào giao diện (render sẽ sập nếu thiếu mảng)', async () => {
  await assert.rejects(repo(() => json({})).repository.searchDestinations('x'), isInternal);
  await assert.rejects(repo(() => json({ destinations: 'x' })).repository.searchDestinations('x'), isInternal);
  await assert.rejects(repo(() => json({ destinations: [validSummary(), { id: 1, name: 'x' }] })).repository.searchDestinations('x'), isInternal);
  await assert.rejects(repo(() => json({ destination: null })).repository.destination('ha-giang'), isInternal);
  await assert.rejects(repo(() => json({ destination: {} })).repository.destination('ha-giang'), isInternal);
  for (const missing of ['places', 'guide', 'references']) {
    const broken = { ...validDestination(), [missing]: 'khong-phai-mang' };
    await assert.rejects(repo(() => json({ destination: broken })).repository.destination('ha-giang'), isInternal, missing);
  }
});

test('điểm đến được nhớ: nhiều nơi cùng tải chỉ gọi MỘT lần; lỗi không được nhớ nên thử lại được', async () => {
  let fail = true;
  const r = repo(() => (fail ? json({ error: { code: 'INTERNAL' } }, 500) : json({ destination: validDestination() })));
  await assert.rejects(r.repository.destination('ha-giang'));
  fail = false;
  const [a, b, c] = await Promise.all([r.repository.destination('ha-giang'), r.repository.destination('ha-giang'), r.repository.destination('ha-giang')]);
  assert.equal(a, b);
  assert.equal(b, c);
  await r.repository.destination('ha-giang');
  assert.equal(r.urls.length, 2, 'một lần lỗi + một lần thành công, các lần sau dùng bản nhớ');
});

test('người gọi hủy thì nhận AbortError nhưng yêu cầu dùng chung vẫn chạy để người khác dùng được', async () => {
  const r = repo(() => json({ destination: validDestination() }));
  const abort = new AbortController();
  const aborted = r.repository.destination('ha-giang', abort.signal);
  abort.abort();
  await assert.rejects(aborted, (e: unknown) => e instanceof DOMException && e.name === 'AbortError');
  assert.equal((await r.repository.destination('ha-giang')).id, 'ha-giang');
  assert.equal(r.urls.length, 1, 'không gọi lại vì yêu cầu đầu vẫn hoàn tất');
  assert.equal(r.signals[0], undefined, 'không gắn tín hiệu của một người gọi vào yêu cầu dùng chung');
});
