import assert from 'node:assert/strict';
import test from 'node:test';
import { galleryIndex, galleryIndexAt } from './galleryPosition.ts';

test('gallery kẹp prev/next ở hai đầu, kể cả bộ ảnh rỗng', () => {
  assert.equal(galleryIndex(-1, 3), 0);
  assert.equal(galleryIndex(3, 3), 2);
  assert.equal(galleryIndex(1, 0), 0);
});

test('gallery tính bước bằng cả khung, không theo thumbnail hay khoảng cách CSS', () => {
  assert.equal(galleryIndexAt(390, 390, 3), 1);
  assert.equal(galleryIndexAt(780, 390, 3), 2);
  assert.equal(galleryIndexAt(358, 358, 3), 1);
  assert.equal(galleryIndexAt(-20, 390, 3), 0);
  assert.equal(galleryIndexAt(900, 390, 3), 2);
  assert.equal(galleryIndexAt(390, 0, 3), 0);
});
