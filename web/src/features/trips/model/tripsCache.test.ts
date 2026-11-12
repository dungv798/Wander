import test from 'node:test';
import assert from 'node:assert/strict';
import { clearTripsCache, loadTripsCache, saveTripsCache } from './tripsCache.ts';
import type { Trip } from './trip.types.ts';

/** Kho giả có đủ ba hàm mà bộ nhớ đệm dùng; `failSet` mô phỏng hết hạn mức. */
function fakeStorage(failSet = false) {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failSet) throw new Error('đầy'); data.set(key, value); },
    removeItem: (key: string) => { data.delete(key); },
  };
}

const TRIP = { id: 't1', name: 'Hà Giang', destinationId: 'ha-giang', items: [] } as unknown as Trip;

test('lưu rồi đọc lại đúng danh sách chuyến và thời điểm lưu', () => {
  const storage = fakeStorage();
  saveTripsCache([TRIP], 1_700_000_000_000, storage);
  const cache = loadTripsCache(storage);
  assert.ok(cache);
  assert.equal(cache.savedAt, 1_700_000_000_000);
  assert.deepEqual(cache.trips, [TRIP]);
});

test('chưa lưu gì thì đọc ra null; xóa rồi cũng là null', () => {
  const storage = fakeStorage();
  assert.equal(loadTripsCache(storage), null);
  saveTripsCache([TRIP], 1, storage);
  clearTripsCache(storage);
  assert.equal(loadTripsCache(storage), null);
});

test('dữ liệu hỏng hoặc sai dạng bị bỏ qua và dọn đi, không làm vỡ giao diện', () => {
  const storage = fakeStorage();
  storage.data.set('wander.web.trips.cache.v1', '{không phải json');
  assert.equal(loadTripsCache(storage), null);
  storage.data.set('wander.web.trips.cache.v1', JSON.stringify({ savedAt: 'x', trips: [] }));
  assert.equal(loadTripsCache(storage), null);
  storage.data.set('wander.web.trips.cache.v1', JSON.stringify({ savedAt: 1, trips: [{ id: 5 }] }));
  assert.equal(loadTripsCache(storage), null);
  assert.equal(storage.data.has('wander.web.trips.cache.v1'), false, 'bản hỏng được xóa');
});

test('hết hạn mức hoặc không có kho thì lưu im lặng, không ném lỗi', () => {
  assert.doesNotThrow(() => saveTripsCache([TRIP], 1, fakeStorage(true)));
  assert.doesNotThrow(() => saveTripsCache([TRIP], 1, null));
  assert.equal(loadTripsCache(null), null);
  assert.doesNotThrow(() => clearTripsCache(null));
});

test('danh sách rỗng vẫn được lưu (người dùng đã xóa hết chuyến thì bản cũ không được sống lại)', () => {
  const storage = fakeStorage();
  saveTripsCache([TRIP], 1, storage);
  saveTripsCache([], 2, storage);
  assert.deepEqual(loadTripsCache(storage)?.trips, []);
});
