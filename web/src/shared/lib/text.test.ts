import test from 'node:test';
import assert from 'node:assert/strict';
import { monthRangeLabel, normalizeSearch } from './text.ts';

test('tìm không phân biệt dấu và hoa thường', () => {
  assert.equal(normalizeSearch('  Hà Giang '), 'ha giang');
  assert.equal(normalizeSearch('Đồng Văn'), 'dong van');
});

test('gộp tháng liền nhau', () => {
  assert.equal(monthRangeLabel([9, 10, 11]), 'Tháng 9–11');
  assert.equal(monthRangeLabel([3, 4, 9, 10, 11]), 'Tháng 3–4, 9–11');
  assert.equal(monthRangeLabel([]), '');
  assert.equal(monthRangeLabel([5, 5, 13, 0]), 'Tháng 5');
});
