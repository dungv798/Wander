import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import type { FetchLike } from '../../../shared/api/ApiClient.ts';
import { HttpCatalogRepository } from './HttpCatalogRepository.ts';

const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });
const validDestination = (id = 'ha-giang'): Record<string, unknown> => ({ id, name: 'Hà Giang', places: [], guide: [], references: [] });
const validSummary = (id = 'ha-giang'): Record<string, unknown> => ({ id, name: 'Hà Giang', region: 'Đông Bắc', lat: 23, lon: 105 });
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

test('venue mới được giữ và kiểm nguồn; legacy thiếu venue vẫn đọc được', async () => {
  const venue = { kind: 'cafe', kindName: 'Quán cà phê', address: '39 Nguyễn Hữu Huân', website: 'https://cafegiang.vn/', sourceUrl: 'https://cafegiang.vn/', checkedAt: '2026-11-07' };
  const destination = { ...validDestination(), places: [{ id: 'p', venue }] };
  assert.deepEqual((await repo(() => json({ destination })).repository.destination('ha-giang')).places[0]?.venue, venue);
  for (const invalid of [{ ...venue, website: 'javascript:alert(1)' }, { ...venue, sourceUrl: '' }]) {
    await assert.rejects(repo(() => json({ destination: { ...destination, places: [{ id: 'p', venue: invalid }] } })).repository.destination('ha-giang'), isInternal);
  }
  assert.equal((await repo(() => json({ destination: { ...destination, places: [{ id: 'old' }] } })).repository.destination('ha-giang')).places[0]?.venue, undefined);
});

test('metadata chủ đề additive: giữ mã thật, từ chối mảng sai để không âm thầm giấu điểm đến', async () => {
  const summary = { ...validSummary(), categories: ['am', 'cho'] };
  assert.deepEqual(await repo(() => json({ destinations: [summary] })).repository.searchDestinations(''), [summary]);
  for (const categories of ['am', ['unknown'], [null]]) {
    await assert.rejects(repo(() => json({ destinations: [{ ...validSummary(), categories }] })).repository.searchDestinations(''), isInternal);
  }
});

test('mã lạ: 404 của máy chủ thành ApiError NOT_FOUND để giao diện hiện đúng lời nhắc', async () => {
  const r = repo(() => json({ error: { code: 'NOT_FOUND', message: 'x' } }, 404));
  await assert.rejects(r.repository.destination('khong-co'), (e: unknown) => e instanceof ApiError && e.code === 'NOT_FOUND' && e.status === 404);
});

test('API additive: thiếu moments trả [] và bản ghi hợp lệ giữ đầy đủ ghi công', async () => {
  assert.deepEqual((await repo(() => json({ destination: validDestination() })).repository.destination('ha-giang')).moments, []);
  const moment = { id: 'cho-1', theme: 'cho', themeLabel: 'Chợ & phố', caption: 'Phiên chợ', photo: { url: '/catalog/photos/test.jpg', author: 'Tác giả', license: 'CC BY-SA 2.0', sourceUrl: 'https://example.org' } };
  const r = repo(() => json({ destination: { ...validDestination(), moments: [moment, null] } }));
  assert.deepEqual((await r.repository.destination('ha-giang')).moments, [moment]);
});

test('thân sai hình dạng thành INTERNAL, không để lọt giá trị hỏng vào giao diện (render sẽ sập nếu thiếu mảng)', async () => {
  for (const coordinates of [{ lat: '23', lon: 105 }, { lat: 23 }, { lat: {}, lon: 105 }]) {
    const invalid = Object.assign(validSummary(), { lat: undefined, lon: undefined }, coordinates);
    await assert.rejects(repo(() => json({ destinations: [invalid] })).repository.searchDestinations(''), isInternal);
  }
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

/** Cài `localStorage` giả toàn cục trong lúc chạy `body`, rồi gỡ (kho bản lưu dùng kho mặc định của trình duyệt). */
async function withLocalStorage(body: () => Promise<void>): Promise<void> {
  const data = new Map<string, string>();
  const fake = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true });
  try { await body(); } finally { Reflect.deleteProperty(globalThis, 'localStorage'); }
}

test('B-09: máy chủ không trả lời (lỗi mạng hoặc 5xx) thì dùng bản điểm đến đã nhớ; không tìm thấy thì không', async () => {
  await withLocalStorage(async () => {
    let mode: 'ok' | 'down' | 'bad-gateway' | 'missing' = 'ok';
    const handler = (): Response => {
      if (mode === 'down') throw new TypeError('Failed to fetch');
      if (mode === 'bad-gateway') return json({}, 502);
      if (mode === 'missing') return json({ error: { code: 'NOT_FOUND' } }, 404);
      return json({ destination: validDestination() });
    };
    // mỗi lần dùng kho mới để bỏ bản nhớ trong bộ nhớ, chỉ còn bản ở localStorage
    await repo(handler).repository.destination('ha-giang');
    mode = 'down';
    assert.equal((await repo(handler).repository.destination('ha-giang')).id, 'ha-giang');
    mode = 'bad-gateway';
    assert.equal((await repo(handler).repository.destination('ha-giang')).id, 'ha-giang');
    mode = 'missing';
    await assert.rejects(repo(handler).repository.destination('ha-giang'), (e: unknown) => e instanceof ApiError && e.code === 'NOT_FOUND');
    mode = 'down';
    await assert.rejects(repo(handler).repository.destination('da-lat'), (e: unknown) => e instanceof ApiError && e.isNetwork, 'chưa từng tải thì vẫn báo lỗi');
  });
});
