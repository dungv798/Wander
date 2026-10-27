import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './ApiError.ts';
import { describeError } from './describeError.ts';
import { CODE_KIND, DEMO_ERROR_CODES, ERROR_INFO } from './errorMessages.const.ts';

test('mã đã biết ra đúng lời nhắc và giữ mã để hiện nhỏ', () => {
  const e = describeError(new ApiError('RATE_LIMITED', 429));
  assert.equal(e.code, 'RATE_LIMITED');
  assert.equal(e.title, 'Bạn thao tác hơi nhanh');
  assert.match(e.text, /Dữ liệu của bạn không mất/);
});

test('mã khôi phục/ghép sai đều ra MỘT thông báo chung, không phân biệt sai hay hết hạn (MĐ-8)', () => {
  const texts = ['INVALID_CODE', 'CODE_ALREADY_USED', 'ATTEMPT_EXPIRED', 'INVALID_PAIRING_CODE'].map((c) => describeError(new ApiError(c)).text);
  assert.equal(new Set(texts).size, 1);
});

test('lỗi lạ, mã lạ hoặc không phải ApiError rơi về lỗi phía Wander, không lộ chữ lỗi thô', () => {
  for (const e of [new Error('boom: secret detail'), 'x', null, new ApiError('MA_LA')]) {
    const d = describeError(e);
    assert.equal(d.title, ERROR_INFO.internal.title);
    assert.doesNotMatch(d.text, /boom|secret/);
  }
});

test('không lời nhắc nào đếm "còn N lần thử"; mọi mã minh họa có trong bảng', () => {
  for (const info of Object.values(ERROR_INFO)) assert.doesNotMatch(info.text, /còn \d+ lần/);
  for (const c of DEMO_ERROR_CODES) assert.ok(c === 'INTERNAL' || CODE_KIND.has(c), `thiếu mã ${c}`);
});

test('tên đặc biệt của đối tượng (constructor, toString, __proto__) không làm hộp lỗi trống; mã lỗi dữ liệu có nhóm riêng', () => {
  for (const code of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    const d = describeError(new ApiError(code));
    assert.equal(d.title, ERROR_INFO.internal.title);
  }
  assert.equal(describeError(new ApiError('END_BEFORE_START')).title, ERROR_INFO.invalid.title);
});
