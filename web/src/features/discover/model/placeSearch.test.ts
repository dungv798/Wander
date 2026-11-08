import test from 'node:test';
import assert from 'node:assert/strict';
import { searchPlaces } from './placeSearch.ts';

const PLACES = [
  { name: 'Hồ Xuân Hương', categoryName: 'Cảnh quan', area: 'Trung tâm', hook: 'Đi bộ quanh hồ' },
  { name: 'Chợ Đà Lạt', categoryName: 'Chợ', area: 'Trung tâm', hook: 'Ăn vặt buổi tối' },
  { name: 'Thác Datanla', categoryName: 'Cảnh quan', area: 'Đèo Prenn', hook: 'Máng trượt núi' },
];

test('tìm không dấu theo tên; tên khớp xếp trước khớp ở trường khác', () => {
  assert.deepEqual(searchPlaces(PLACES, 'ho xuan').map((p) => p.name), ['Hồ Xuân Hương']);
  assert.deepEqual(searchPlaces(PLACES, 'ho').map((p) => p.name), ['Hồ Xuân Hương', 'Thác Datanla', 'Chợ Đà Lạt'].filter((n) => searchPlaces(PLACES, 'ho').some((p) => p.name === n)));
  assert.equal(searchPlaces(PLACES, 'ho')[0]?.name, 'Hồ Xuân Hương');
});

test('"trekking"/"trek"/"hiking" tìm ra nơi thuộc loại Leo núi dù chữ không xuất hiện trong dữ liệu', () => {
  const places = [...PLACES, { name: 'Đỉnh Lang Biang', categoryName: 'Leo núi', area: 'Lạc Dương', hook: 'Lên đỉnh', category: 'leo' }];
  for (const q of ['trekking', 'trek', 'Hiking', 'leo nui']) assert.deepEqual(searchPlaces(places, q).map((p) => p.name), ['Đỉnh Lang Biang'], q);
  assert.equal(searchPlaces(places, 'trekking').length, 1, 'không kéo nơi thuộc loại khác');
});

test('tìm theo khu vực và loại; truy vấn rỗng giữ thứ tự biên tập; không khớp thì rỗng', () => {
  assert.deepEqual(searchPlaces(PLACES, 'deo prenn').map((p) => p.name), ['Thác Datanla']);
  assert.equal(searchPlaces(PLACES, 'canh quan').length, 2);
  assert.equal(searchPlaces(PLACES, '  ').length, 3);
  assert.equal(searchPlaces(PLACES, 'zzz').length, 0);
});
