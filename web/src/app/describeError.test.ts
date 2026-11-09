import test from 'node:test';
import assert from 'node:assert/strict';
import { describeError } from './describeError.ts';
import { CRASH_DETAIL_MAX_CHARS, CRASH_STACK_LINES } from './errorBoundary.const.ts';

test('describeError: lỗi thường có tên, thông điệp và chỉ vài dòng đầu của dấu vết', () => {
  const error = new TypeError('x is undefined');
  error.stack = ['TypeError: x is undefined', ...Array.from({ length: 30 }, (_, i) => `    at fn${i} (app.js:1:${i})`)].join('\n');
  const text = describeError(error);
  assert.match(text, /^TypeError: x is undefined\n/);
  assert.equal(text.split('\n').length, 1 + CRASH_STACK_LINES, 'thông điệp + đúng số dòng dấu vết cho phép');
});

test('describeError: giá trị không phải Error (chuỗi, null) vẫn ra chuỗi, không ném lỗi', () => {
  assert.equal(describeError('hỏng'), 'hỏng');
  assert.equal(describeError(null), 'null');
});

test('describeError: không bao giờ dài quá giới hạn ký tự', () => {
  assert.ok(describeError(new Error('a'.repeat(5000))).length <= CRASH_DETAIL_MAX_CHARS);
  assert.ok(describeError('b'.repeat(5000)).length <= CRASH_DETAIL_MAX_CHARS);
});
