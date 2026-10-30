import test from 'node:test';
import assert from 'node:assert/strict';
import { entranceCount } from './pinEntrance.ts';

test('ghim thường và reduced-motion luôn hiện ngay, chỉ script quay có stagger', () => {
  assert.equal(entranceCount(5, 0, false, false), 5);
  assert.equal(entranceCount(5, 0, true, true), 5);
  assert.deepEqual([0, 239, 240, 480, 720, 960, 2000].map(ms => entranceCount(5, ms, true, false)), [1, 1, 2, 3, 4, 5, 5]);
  assert.equal(entranceCount(0, 0, true, false), 0);
});
