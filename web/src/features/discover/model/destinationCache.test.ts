import test from 'node:test';
import assert from 'node:assert/strict';
import { DESTINATION_CACHE_LIMITS, loadCachedDestination, saveCachedDestination } from './destinationCache.ts';
import type { DestinationDetail } from './Catalog.types.ts';

/** Kho giả; `failSet` mô phỏng hết hạn mức. */
function fakeStorage(failSet = false) {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failSet) throw new Error('đầy'); data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

/** Điểm đến tối thiểu đủ qua kiểm hình dạng; `pad` làm nó nặng hơn. */
function dest(id: string, pad = ''): DestinationDetail {
  return { id, name: id, places: [], guide: [], references: [], pad } as unknown as DestinationDetail;
}

test('lưu rồi đọc lại đúng điểm đến theo mã', () => {
  const storage = fakeStorage();
  saveCachedDestination(dest('ha-giang'), 1, storage);
  assert.equal(loadCachedDestination('ha-giang', storage)?.id, 'ha-giang');
  assert.equal(loadCachedDestination('da-lat', storage), null);
});

test('chỉ giữ vài điểm đến gần nhất; điểm đến lưu cũ nhất bị bỏ', () => {
  const storage = fakeStorage();
  const ids = Array.from({ length: DESTINATION_CACHE_LIMITS.MAX_ENTRIES + 1 }, (_, i) => `d${i}`);
  ids.forEach((id, i) => saveCachedDestination(dest(id), i, storage));
  assert.equal(loadCachedDestination('d0', storage), null, 'cũ nhất bị bỏ');
  assert.equal(loadCachedDestination(ids[ids.length - 1]!, storage)?.id, ids[ids.length - 1]);
});

test('lưu lại cùng điểm đến thì thay bản cũ, không nhân đôi', () => {
  const storage = fakeStorage();
  saveCachedDestination(dest('a', 'x'), 1, storage);
  saveCachedDestination(dest('a', 'y'), 2, storage);
  const raw = JSON.parse(storage.data.get(DESTINATION_CACHE_LIMITS.KEY) ?? '{}') as { entries: unknown[] };
  assert.equal(raw.entries.length, 1);
});

test('bản quá lớn không được lưu (tránh làm đầy kho dùng chung với phiên)', () => {
  const storage = fakeStorage();
  saveCachedDestination(dest('lon', 'x'.repeat(DESTINATION_CACHE_LIMITS.MAX_CHARS)), 1, storage);
  assert.equal(loadCachedDestination('lon', storage), null);
});

test('dữ liệu hỏng, sai dạng, hết hạn mức hoặc không có kho đều không ném lỗi', () => {
  const storage = fakeStorage();
  storage.data.set(DESTINATION_CACHE_LIMITS.KEY, '{hỏng');
  assert.equal(loadCachedDestination('a', storage), null);
  storage.data.set(DESTINATION_CACHE_LIMITS.KEY, JSON.stringify({ entries: [{ id: 'a', savedAt: 1, data: { id: 'a' } }] }));
  assert.equal(loadCachedDestination('a', storage), null, 'thiếu places/guide/references');
  assert.doesNotThrow(() => saveCachedDestination(dest('a'), 1, fakeStorage(true)));
  assert.doesNotThrow(() => saveCachedDestination(dest('a'), 1, null));
  assert.equal(loadCachedDestination('a', null), null);
});
