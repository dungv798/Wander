import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldCommit } from './swipeGesture.ts';

test('kéo xa quá ngưỡng thì quẹt', () => {
  assert.equal(shouldCommit(111, 0), true);
  assert.equal(shouldCommit(-120, 0), true);
  assert.equal(shouldCommit(60, 0), false);
});

test('kéo nhanh dù ngắn cũng quẹt, nhưng quá ngắn thì không', () => {
  assert.equal(shouldCommit(50, 0.8), true);
  assert.equal(shouldCommit(20, 2), false);
  assert.equal(shouldCommit(50, 0.3), false);
});
