import test from 'node:test';
import assert from 'node:assert/strict';
import { IDENTITY } from './identity.const.ts';
import { NO_LOCKS, clearFailures, isLocked, recordFailure, sanitizeLocks, triesOf } from './attemptLock.ts';

const T0 = 1_000_000;

/** Ghi `n` lần sai liên tiếp. */
function fail(n: number, scope: 'recover' | 'reauth' | 'pair' = 'recover') {
  let s = NO_LOCKS;
  for (let i = 0; i < n; i += 1) s = recordFailure(s, scope, T0 + i);
  return s;
}

test('sai dưới 5 lần chưa khóa; đủ 5 lần thì khóa tạm đến hết LOCK_MS', () => {
  assert.equal(isLocked(fail(IDENTITY.MAX_ATTEMPTS - 1), 'recover', T0 + 10), false);
  const s = fail(IDENTITY.MAX_ATTEMPTS);
  assert.equal(isLocked(s, 'recover', T0 + 10), true);
  assert.equal(isLocked(s, 'recover', T0 + IDENTITY.MAX_ATTEMPTS + IDENTITY.LOCK_MS), false, 'hết hạn thì mở khóa');
});

test('khóa vẫn còn qua "tải lại" (đã lưu bền) và mỗi nơi đếm riêng', () => {
  const reloaded = sanitizeLocks(JSON.parse(JSON.stringify(fail(IDENTITY.MAX_ATTEMPTS))))!;
  assert.equal(isLocked(reloaded, 'recover', T0 + 100), true);
  assert.equal(isLocked(reloaded, 'reauth', T0 + 100), false);
  assert.equal(triesOf(fail(2, 'pair'), 'recover', T0), 0);
});

test('hết khóa thì đếm lại từ 0; nhập đúng xóa đếm', () => {
  const locked = fail(IDENTITY.MAX_ATTEMPTS);
  const later = T0 + IDENTITY.LOCK_MS + 1000;
  assert.equal(triesOf(locked, 'recover', later), 0);
  assert.equal(triesOf(recordFailure(locked, 'recover', later), 'recover', later), 1);
  assert.deepEqual(clearFailures(fail(3), 'recover'), {});
});

test('dữ liệu khóa hỏng bị bỏ an toàn', () => {
  assert.equal(sanitizeLocks('x'), null);
  assert.deepEqual(sanitizeLocks({ recover: { tries: -1, until: 5 }, pair: { tries: 99, until: 7 }, la: 1 }), { pair: { tries: IDENTITY.MAX_ATTEMPTS, until: 7 } });
});

test('đang bị khóa thì ghi thêm lần sai không đổi gì (không gia hạn khóa)', () => {
  const locked = fail(IDENTITY.MAX_ATTEMPTS);
  assert.equal(recordFailure(locked, 'recover', T0 + 100), locked);
});
