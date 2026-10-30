import test from 'node:test';
import assert from 'node:assert/strict';
import { countTripStatuses, selectTrips, tripStatus } from './tripList.ts';
import type { TripListEntry } from './tripList.ts';
import { readTripListOptions } from './useTripList.ts';

const TODAY = '2026-10-30';
const options = { query: '', status: null, sort: 'departure' } as const;
const trip = (id: string, over: Partial<TripListEntry> = {}): TripListEntry => ({ id, name: id, destinationId: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-03', datesTentative: false, createdAt: 1, ...over });

test('nhóm ngày null, dự kiến, đang đi gồm hai đầu ngày theo đồng hồ giả', () => {
  assert.equal(tripStatus(trip('null', { startDate: null }), TODAY), 'tentative');
  assert.equal(tripStatus(trip('tentative', { datesTentative: true }), TODAY), 'tentative');
  assert.equal(tripStatus(trip('start', { startDate: TODAY }), TODAY), 'ongoing');
  assert.equal(tripStatus(trip('end', { startDate: '2026-10-29', endDate: TODAY }), TODAY), 'ongoing');
  assert.equal(tripStatus(trip('past', { startDate: '2026-10-01', endDate: '2026-10-29' }), TODAY), 'past');
  assert.deepEqual(countTripStatuses([trip('u'), trip('t', { startDate: null }), trip('o', { startDate: TODAY })], TODAY), { upcoming: 1, tentative: 1, ongoing: 1, past: 0 });
});

test('tìm tên/điểm đến không phân biệt hoa thường và dấu; lọc kết hợp', () => {
  const trips = [trip('1', { name: 'Đà Lạt cuối tuần' }), trip('2', { name: 'Mùa hoa', destinationId: 'da-lat' })];
  assert.deepEqual(selectTrips(trips, { ...options, query: 'DA LAT' }, TODAY).map(t => t.id), ['1']);
  assert.equal(selectTrips(trips, { ...options, query: 'da lat' }, TODAY, { 'da-lat': 'Đà Lạt' }).length, 2);
  assert.equal(selectTrips(trips, { ...options, query: 'da lat', status: 'past' }, TODAY).length, 0);
});

test('cùng ngày có thứ tự ổn định, null cuối; mới tạo và tên tiếng Việt', () => {
  const trips = [trip('b'), trip('a'), trip('new', { createdAt: 3 }), trip('null', { startDate: null })];
  assert.deepEqual(selectTrips(trips, options, TODAY).map(t => t.id), ['new', 'a', 'b', 'null']);
  assert.deepEqual(selectTrips(trips, { ...options, sort: 'created' }, TODAY).map(t => t.id), ['new', 'a', 'b', 'null']);
  assert.deepEqual(selectTrips([trip('d', { name: 'Đà Lạt' }), trip('a', { name: 'Ánh nắng' }), trip('h', { name: 'Hà Giang' })], { ...options, sort: 'name' }, TODAY).map(t => t.id), ['a', 'd', 'h']);
  assert.deepEqual(trips.map(t => t.id), ['b', 'a', 'new', 'null']);
});

test('localStorage thiếu/bị chặn dùng mặc định', () => {
  assert.deepEqual(readTripListOptions(), options);
});

test('localStorage giữ đúng lựa chọn, loại dữ liệu sai và chịu được dữ liệu hỏng hoặc bị chặn', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let value = JSON.stringify({ query: 'doi', status: 'ongoing', sort: 'name' });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => value } });
  try {
    assert.deepEqual(readTripListOptions(), { query: 'doi', status: 'ongoing', sort: 'name' });
    value = JSON.stringify({ query: 9, status: 'bogus', sort: 'bogus' });
    assert.deepEqual(readTripListOptions(), options);
    value = '{';
    assert.deepEqual(readTripListOptions(), options);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: () => { throw new Error('blocked'); } });
    assert.deepEqual(readTripListOptions(), options);
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'localStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
