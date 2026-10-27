import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeToken } from './sessionToken.ts';

const VALID = 'A'.repeat(43);

test('chỉ nhận bí mật phiên đúng dạng (43–128 ký tự base64url); mọi thứ khác là chưa có phiên', () => {
  assert.deepEqual(sanitizeToken({ token: VALID }), { token: VALID });
  assert.deepEqual(sanitizeToken({ token: 'A'.repeat(128) }), { token: 'A'.repeat(128) });
  for (const bad of [{ token: 'ngan' }, { token: 'A'.repeat(42) }, { token: 'A'.repeat(129) }, { token: `${VALID}!` }, { token: 123 }, { token: null }, {}, null, 'x', [], 5]) {
    assert.deepEqual(sanitizeToken(bad), { token: null }, JSON.stringify(bad));
  }
});
