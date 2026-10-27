import test from 'node:test';
import assert from 'node:assert/strict';
import { Money, MoneyError, formatVnd } from './Money.ts';

/** Gom mã lỗi của một phép tính; 'OK' nếu không lỗi. */
const codeOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof MoneyError) return e.code;
  }
  return 'OK';
};

test('D18: rỗng là chưa biết, 0 là biết bằng không', () => {
  assert.equal(Money.parse(''), null);
  assert.equal(Money.parse('   '), null);
  assert.equal(Money.parse('0')?.thousand, 0);
});

test('D17: chỉ nhận số nguyên không âm tới trần', () => {
  assert.equal(Money.parse('150')?.vnd, 150_000);
  assert.equal(codeOf(() => Money.parse('-5')), 'NEGATIVE');
  assert.equal(codeOf(() => Money.parse('1.5')), 'MALFORMED');
  assert.equal(codeOf(() => Money.parse('abc')), 'MALFORMED');
  assert.equal(codeOf(() => Money.parse('1000000001')), 'TOO_LARGE');
  assert.equal(Money.parse('1000000000')?.thousand, 1_000_000_000);
});

test('hiển thị đầy đủ VND với khoảng trắng không ngắt', () => {
  assert.equal(Money.ofThousand(1500).format(), '1.500.000 ₫');
  assert.equal(formatVnd(0), '0 ₫');
  assert.equal(formatVnd(600_000), '600.000 ₫');
});

test('cộng tiền và chặn vượt trần', () => {
  assert.equal(Money.ofThousand(2).plus(Money.ofThousand(3)).thousand, 5);
  assert.equal(codeOf(() => Money.ofThousand(1_000_000_000).plus(Money.ofThousand(1))), 'TOO_LARGE');
});

test('khớp RawInput.java: bỏ số 0 đầu rồi mới đo độ dài; quá 10 chữ số là TOO_LARGE', () => {
  assert.equal(codeOf(() => Money.parse('99999999999')), 'TOO_LARGE');
  assert.equal(Money.parse('0000000150')?.thousand, 150);
  assert.equal(codeOf(() => Money.parse('00000000000001')), 'OK');
});
