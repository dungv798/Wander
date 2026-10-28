import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDestinations, resolveDestination, readDestination, writeDestination } from './destinationSelection.ts';

const destinations = [{ id: 'da-lat', name: 'Đà Lạt', region: 'Tây Nguyên' }, { id: 'ha-giang', name: 'Hà Giang', region: 'Đông Bắc' }];
test('lọc theo tên hoặc vùng, bỏ hoa thường và dấu, giữ thứ tự catalog', () => {
  assert.deepEqual(filterDestinations(destinations, ' ĐÀ LẠT '), [destinations[0]]);
  assert.deepEqual(filterDestinations(destinations, 'dong bac'), [destinations[1]]);
  assert.deepEqual(filterDestinations(destinations, ''), destinations);
  assert.deepEqual(filterDestinations(destinations, 'zzz'), []);
});
test('kho kiểm mã bằng catalog và dự phòng khi lưu trữ bị chặn', () => {
  assert.equal(resolveDestination('la', destinations), 'ha-giang', 'mã lạ rơi về điểm đến mặc định chứ không phải mục đầu catalog');
  assert.equal(resolveDestination(null, [destinations[0]!]), 'da-lat', 'catalog không có mặc định thì lấy mục đầu');
  assert.equal(resolveDestination('ha-giang', destinations), 'ha-giang');
  assert.equal(resolveDestination(null, []), 'ha-giang');
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
  writeDestination(storage, 'da-lat');
  assert.equal(readDestination(storage), 'da-lat');
  const denied = { getItem: () => { throw new Error(); }, setItem: () => { throw new Error(); } };
  assert.equal(readDestination(denied), null);
  assert.doesNotThrow(() => writeDestination(denied, 'da-lat'));
});
