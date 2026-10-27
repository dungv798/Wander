import test from 'node:test';
import assert from 'node:assert/strict';
import { newAttemptId, newSessionToken, randomToken } from './randomToken.ts';

test('bí mật phiên: 43 ký tự base64url (khớp backend), không đệm, mỗi lần một giá trị khác', () => {
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) {
    const t = newSessionToken();
    assert.match(t, /^[A-Za-z0-9_-]{43}$/);
    seen.add(t);
  }
  assert.equal(seen.size, 50);
});

test('mã lần thử khôi phục: 32 ký tự base64url, trong khoảng backend cho phép (16–128)', () => {
  assert.match(newAttemptId(), /^[A-Za-z0-9_-]{32}$/);
});

test('mã hóa đúng với nguồn ngẫu nhiên cố định, kể cả byte tạo ký tự + và / ở base64 thường', () => {
  const fixed = { fill: (b: Uint8Array): void => b.forEach((_, i) => { b[i] = [0xfb, 0xff, 0xbf][i % 3] ?? 0; }) };
  const t = randomToken(3, fixed as never);
  assert.equal(t, '-_-_'.slice(0, 4), 'FB FF BF → "-_-_" (base64url), không có + / =');
});
