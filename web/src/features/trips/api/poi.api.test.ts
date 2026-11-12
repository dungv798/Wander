import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiClient } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { PoiApi } from './poi.api.ts';

const poi = { id: 'poi-1', name: 'Quán', kind: 'food', lat: 11.94, lon: 108.45, distanceM: 12.34, address: null, openingHoursRaw: ' Mo-Su 08:00-22:00 ', openingHoursStatus: 'RAW', phone: null, website: null, verificationStatus: 'SNAPSHOT_UNVERIFIED', attribution: { sourceKind: 'OSM', sourceUrl: 'https://www.openstreetmap.org/node/1', snapshotAt: '2026-10-29', license: 'ODbL-1.0', licenseUrl: 'https://opendatacommons.org/licenses/odbl/1-0/', credit: '© OpenStreetMap contributors' } };
const near = { lat: 11.94, lon: 108.45 };

test('đúng query, signal, khoảng cách tăng và raw giờ nguyên vẹn', async () => {
  const controller = new AbortController();
  const api = new PoiApi(new ApiClient(async (url, init) => {
    const query = new URL(url, 'https://test.local').searchParams;
    assert.equal(query.get('near'), '11.94,108.45');
    assert.equal(query.get('kind'), 'food');
    assert.equal(query.get('radiusM'), '1500');
    assert.equal(query.get('limit'), '12');
    assert.equal(init?.signal, controller.signal);
    return Response.json({ poi: [{ ...poi, id: 'poi-2', distanceM: 200 }, poi] });
  }));
  const result = await api.nearby('da-lat', 'food', near, undefined, controller.signal);
  assert.deepEqual(result.map(p => p.distanceM), [12.34, 200]);
  assert.equal(result[0]?.openingHoursRaw, poi.openingHoursRaw);
});
test('rỗng là thành công; dữ liệu hỏng không bị coi là rỗng', async () => {
  for (const body of [{}, { poi: null }, { poi: [{ ...poi, distanceM: -1 }] }, { poi: [{ ...poi, name: null }] }]) {
    const api = new PoiApi(new ApiClient(async () => Response.json(body)));
    await assert.rejects(api.nearby('da-lat', 'cafe', near), (e: unknown) => e instanceof ApiError && e.code === 'INTERNAL');
  }
  assert.deepEqual(await new PoiApi(new ApiClient(async () => Response.json({ poi: [] }))).nearby('da-lat', 'rest', near, 3000), []);
});
test('mạng, 429, 404 và JSON hỏng đi qua lỗi ApiClient', async () => {
  for (const [fetcher, code] of [
    [async () => { throw new TypeError('offline'); }, 'NETWORK'],
    [async () => Response.json({ code: 'RATE_LIMITED' }, { status: 429 }), 'RATE_LIMITED'],
    [async () => Response.json({ code: 'NOT_FOUND' }, { status: 404 }), 'NOT_FOUND'],
    [async () => new Response('broken'), 'INTERNAL'],
  ] as const) await assert.rejects(new PoiApi(new ApiClient(fetcher)).nearby('da-lat', 'food', near), (e: unknown) => e instanceof ApiError && e.code === code);
});
test('hủy yêu cầu giữ AbortError, không biến thành lỗi mạng', async () => {
  const controller = new AbortController();
  const api = new PoiApi(new ApiClient(async (_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  })));
  const pending = api.nearby('da-lat', 'food', near, 1500, controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: 'AbortError' });
});
