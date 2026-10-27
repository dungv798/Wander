import test from 'node:test';
import assert from 'node:assert/strict';
import { LatestOnly } from './LatestOnly.ts';

test('chỉ phiếu của lần gọi mới nhất còn hiệu lực', () => {
  const guard = new LatestOnly();
  const first = guard.begin();
  assert.equal(guard.isCurrent(first), true);
  const second = guard.begin();
  assert.equal(guard.isCurrent(first), false);
  assert.equal(guard.isCurrent(second), true);
});
