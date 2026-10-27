import test from 'node:test';
import assert from 'node:assert/strict';
import { RecoveryCode } from './RecoveryCode.ts';
import type { RandomSource } from './RecoveryCode.ts';

let tick = 0;
const counting: RandomSource = {
  /** Điền byte tăng dần để kết quả xác định (có trộn để thử thách không bị lặp một chỉ số). */
  fill(bytes: Uint8Array): void {
    bytes.forEach((_, i) => {
      tick += 7;
      bytes[i] = (i + tick) % 256;
    });
  },
};

test('sinh 30 ký hiệu, hiện 6 nhóm × 5', () => {
  const c = RecoveryCode.generate(counting);
  assert.equal(c.normalized.length, 30);
  assert.equal(c.format().split('-').length, 6);
  assert.equal(c.format().split('-').every((g) => g.length === 5), true);
});

test('chuẩn hóa O→0, I/L→1 và bỏ dấu gạch', () => {
  const c = RecoveryCode.generate(counting);
  const messy = c.format().toLowerCase().replace(/0/g, 'o').replace(/1/g, 'l');
  assert.equal(RecoveryCode.parse(messy)?.normalized, c.normalized);
  assert.equal(RecoveryCode.parse('ABC'), null);
});

test('thử thách nhập lại 2/6 nhóm', () => {
  const c = RecoveryCode.generate(counting);
  const picks = c.pickChallenge(counting);
  assert.equal(picks.length, 2);
  assert.equal(new Set(picks).size, 2);
  const answers = picks.map((i) => c.groups[i] ?? '');
  assert.equal(c.matchesChallenge(picks, answers), true);
  assert.equal(c.matchesChallenge(picks, ['XXXXX', 'YYYYY']), false);
});

test('chuẩn hóa đúng như backend: chỉ bỏ khoảng trắng và gạch; ký tự lạ làm mã không hợp lệ', () => {
  const c = RecoveryCode.generate(counting);
  assert.ok(RecoveryCode.parse(` ${c.format().replace(/-/g, ' - ')} `));
  assert.equal(RecoveryCode.parse(c.format().replace('-', '#')), null);
});
