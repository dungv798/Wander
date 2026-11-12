import test from 'node:test';
import assert from 'node:assert/strict';
import { PairingCode } from './PairingCode.ts';
import type { RandomSource } from './RecoveryCode.ts';

/** A fixed random source for tests. */
const fixed = (values: number[]): RandomSource => ({
  fill(bytes) {
    bytes.forEach((_, i) => {
      bytes[i] = values[i % values.length] ?? 0;
    });
  },
});

test('sinh mã 8 ký hiệu hiện XXXX-XXXX từ bảng Crockford', () => {
  const c = PairingCode.generate(fixed([0, 1, 2, 3, 4, 5, 6, 7]));
  assert.equal(c.normalized, '01234567');
  assert.equal(c.format(), '0123-4567');
});

test('đọc mã: chữ thường, khoảng trắng, O→0, I/L→1 đều được; sai độ dài hoặc ký tự lạ thì null', () => {
  assert.equal(PairingCode.parse('0o1l-2345')?.normalized, '00112345');
  assert.equal(PairingCode.parse('  abcd efgh ')?.normalized, 'ABCDEFGH');
  assert.equal(PairingCode.parse('1234-567'), null);
  assert.equal(PairingCode.parse('1234-567U'), null, 'U không có trong bảng Crockford');
  assert.equal(PairingCode.parse(''), null);
});
