import test from 'node:test';
import assert from 'node:assert/strict';
import { filterDestinations, resolveDestination, selectedDestination, readDestination, writeDestination } from './destinationSelection.ts';

const destinations = [{ id: 'da-lat', name: 'Đà Lạt', region: 'Tây Nguyên' }, { id: 'ha-giang', name: 'Hà Giang', region: 'Đông Bắc' }];
test('chưa chọn và mã hỏng giữ chế độ Việt Nam; mã dự phòng không trở thành lựa chọn thật', () => {
  for (const value of [null, '', '../da-lat', {}, 12]) assert.equal(selectedDestination(value), null);
  assert.equal(selectedDestination('da-lat'), 'da-lat');
  assert.equal(selectedDestination('da-lat', destinations), 'da-lat');
  assert.equal(selectedDestination('ma-la', destinations), null);
  assert.equal(selectedDestination('da-lat', []), null);
  assert.equal(selectedDestination(null, destinations), null);
  assert.equal(resolveDestination(null, destinations), 'ha-giang', 'route/API cũ vẫn có dự phòng kỹ thuật');
});
test('mã lưu hợp lệ được dùng ngay khi catalog chưa tải; chỉ xác thực tồn tại khi đã tải', () => {
  assert.equal(resolveDestination('da-lat', undefined), 'da-lat');
  assert.equal(resolveDestination('da-lat', destinations), 'da-lat');
  assert.equal(resolveDestination('ma-la', undefined), 'ma-la');
  assert.equal(resolveDestination('ma-la', destinations), 'ha-giang');
  assert.equal(resolveDestination('da-lat', []), 'ha-giang', 'rỗng đã tải khác chưa tải');
  assert.equal(resolveDestination(null, undefined), 'ha-giang', 'người mới giữ mặc định');
  for (const invalid of ['', '../da-lat', 'Đà Lạt', 'a'.repeat(65), {}, 12]) {
    assert.equal(resolveDestination(invalid, undefined), 'ha-giang');
  }
});
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
