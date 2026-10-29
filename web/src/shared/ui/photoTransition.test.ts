import test from 'node:test';
import assert from 'node:assert/strict';
import { photoTransitionMode } from './photoTransition.ts';

test('giảm chuyển động bỏ cả View Transitions và FLIP; thiếu API vẫn mở tức thời', () => {
  assert.equal(photoTransitionMode(true, true, true), 'none');
  assert.equal(photoTransitionMode(true, false, true), 'none');
  assert.equal(photoTransitionMode(false, true, true), 'view');
  assert.equal(photoTransitionMode(false, false, true), 'flip');
  assert.equal(photoTransitionMode(false, false, false), 'none');
});
