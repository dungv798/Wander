import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAverage, starsText } from './ratingFormat.ts';

test('điểm trung bình dùng dấu phẩy và luôn một chữ số thập phân', () => {
  assert.equal(formatAverage(4.5), '4,5');
  assert.equal(formatAverage(5), '5,0');
  assert.equal(formatAverage(null), '');
});

test('hàng sao: đủ năm ký tự, kẹp giá trị ngoài khoảng', () => {
  assert.equal(starsText(4), '★★★★☆');
  assert.equal(starsText(0), '☆☆☆☆☆');
  assert.equal(starsText(9), '★★★★★');
  assert.equal(starsText(-2), '☆☆☆☆☆');
});
