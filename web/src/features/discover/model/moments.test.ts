import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMoments, filterMoments, momentThemes } from './moments.ts';

const photo = { url: '/catalog/photos/test.jpg', author: 'Tác giả', license: 'CC BY-SA 2.0', sourceUrl: 'https://example.org/photo' };
const market = { id: 'cho-1', theme: 'cho', themeLabel: 'Chợ & phố', caption: 'Một sáng ở chợ', photo };
const food = { ...market, id: 'mon-1', theme: 'mon-an', themeLabel: 'Món ăn' };

test('moments: thiếu, null hoặc sai kiểu đều thành mảng rỗng', () => {
  for (const value of [undefined, null, {}, '', 1, []]) assert.deepEqual(parseMoments(value), []);
});

test('moments: giữ bản hợp lệ, bỏ bản hỏng, chủ đề lạ và mã trùng', () => {
  const bad = [null, {}, { ...market, theme: 'unknown' }, { ...market, caption: '' }, { ...market, photo: { ...photo, license: null } }];
  assert.deepEqual(parseMoments([...bad, market, market, food]), [market, food]);
});

test('lọc chủ đề giữ thứ tự và không thay đổi dữ liệu nguồn; chip không lặp', () => {
  const moments = parseMoments([market, food, { ...market, id: 'cho-2' }]);
  assert.equal(filterMoments(moments, 'all'), moments);
  assert.deepEqual(filterMoments(moments, 'cho').map(m => m.id), ['cho-1', 'cho-2']);
  assert.deepEqual(filterMoments(moments, 'nghe'), []);
  assert.deepEqual(momentThemes(moments), [{ theme: 'cho', label: 'Chợ & phố' }, { theme: 'mon-an', label: 'Món ăn' }]);
  assert.equal(moments.length, 3);
});
