import test from 'node:test';
import assert from 'node:assert/strict';
import { NO_SESSION, sanitizeSession } from './identitySanitize.ts';

test('cờ phiên hợp lệ được giữ; mốc đã biết hỏng bị bỏ nhưng không làm hỏng cờ khác', () => {
  assert.deepEqual(sanitizeSession({ recovered: true, known: { hasCode: true, deviceCount: 2 } }), { recovered: true, known: { hasCode: true, deviceCount: 2 } });
  assert.deepEqual(sanitizeSession({ recovered: true, known: { hasCode: 'x', deviceCount: 2 } }), { recovered: true, known: null });
  assert.deepEqual(sanitizeSession({ known: { hasCode: true, deviceCount: -1 } }), { recovered: false, known: null });
  assert.deepEqual(sanitizeSession({ known: { hasCode: true, deviceCount: 1.5 } }), { recovered: false, known: null });
});

test('giá trị không phải đối tượng thì bỏ (rơi về mặc định ở PersistentStore)', () => {
  for (const bad of [null, 'x', 5, [], undefined]) assert.equal(sanitizeSession(bad), null);
  assert.deepEqual(NO_SESSION, { recovered: false, known: null });
});

test('không bao giờ mang bí mật: trường lạ như token bị bỏ khi làm sạch', () => {
  const s = sanitizeSession({ recovered: false, known: null, token: 'A'.repeat(43), deviceId: 'x' });
  assert.deepEqual(s, { recovered: false, known: null });
});
