import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeServer, sanitizeSession } from './identitySanitize.ts';

const GOOD = {
  identity: { createdAt: 5, codeHash: 'h1:abc', devices: [{ id: 'd1', name: 'Điện thoại', at: 1 }], events: [{ at: 2, kind: 'created', device: 'Điện thoại' }], unseen: true },
  pairing: { code: '0123ABCD', number: 42, name: 'Máy mới', at: 3, status: 'waiting' },
  requests: [1, 2],
};

test('máy chủ giả hợp lệ được giữ nguyên', () => {
  const s = sanitizeServer(GOOD)!;
  assert.equal(s.identity?.devices[0]?.name, 'Điện thoại');
  assert.equal(s.pairing?.number, 42);
  assert.deepEqual(s.requests, [1, 2]);
});

test('dữ liệu hỏng: không phải đối tượng → null; danh tính không còn thiết bị hợp lệ → chưa có danh tính', () => {
  assert.equal(sanitizeServer('x'), null);
  assert.equal(sanitizeServer({ identity: { devices: [{ id: 1 }] } })!.identity, null);
});

test('sự kiện lạ và yêu cầu ghép có mã sai bị bỏ, phần còn lại giữ', () => {
  const s = sanitizeServer({ ...GOOD, identity: { ...GOOD.identity, events: [{ at: 1, kind: 'la' }, { at: 2, kind: 'code' }] }, pairing: { ...GOOD.pairing, code: 'ngan' } })!;
  assert.deepEqual(s.identity?.events.map((e) => e.kind), ['code']);
  assert.equal(s.pairing, null);
});

test('phiên: thiếu deviceId → null (chưa có danh tính trên máy này); kiểu sai bị bỏ', () => {
  assert.deepEqual(sanitizeSession({}), { deviceId: null, recovered: false });
  assert.deepEqual(sanitizeSession({ deviceId: 'd1', recovered: true }), { deviceId: 'd1', recovered: true });
  assert.equal(sanitizeSession(null), null);
});
