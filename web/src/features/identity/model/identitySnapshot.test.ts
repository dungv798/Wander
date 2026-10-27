import test from 'node:test';
import assert from 'node:assert/strict';
import { expiredBranch, toSnapshot } from './identitySnapshot.ts';

const FALLBACK = 'Máy này';
const sessions = { sessions: [{ id: 's1', createdAt: '2026-10-27T01:00:00Z', lastSeenAt: '2026-10-27T02:00:00Z', current: true, deviceName: 'iPhone' }, { id: 's2', lastSeenAt: '2026-10-27T03:00:00Z', current: false, deviceName: null }] };
const events = { events: [{ kind: 'paired', deviceName: 'Laptop', at: '2026-10-27T03:00:00Z' }, { kind: 'created', deviceName: null, at: '2026-10-27T01:00:00Z' }], unseen: true };

test('ghép ba phản hồi thành ảnh chụp: thiết bị, hoạt động, cờ chưa xem và đã có mã', () => {
  const s = toSnapshot(sessions, events, { hasCode: true, createdAt: 'x' }, FALLBACK);
  assert.ok(s);
  assert.equal(s.devices.length, 2);
  assert.deepEqual(s.devices[0], { id: 's1', name: 'iPhone', at: Date.parse('2026-10-27T02:00:00Z'), current: true });
  assert.equal(s.devices[1]?.name, FALLBACK, 'thiết bị chưa đặt tên dùng tên dự phòng');
  assert.equal(s.devices[1]?.current, false);
  assert.deepEqual(s.events[0], { at: Date.parse('2026-10-27T03:00:00Z'), kind: 'paired', device: 'Laptop' });
  assert.equal('device' in (s.events[1] ?? {}), false, 'sự kiện không tên máy thì không có trường device');
  assert.equal(s.unseen, true);
  assert.equal(s.hasCode, true);
});

test('dữ liệu hỏng: phần tử sai bị bỏ, loại sự kiện lạ bị bỏ, thiếu danh sách phiên là phản hồi hỏng (null)', () => {
  const messy = { sessions: [null, 5, { id: 7 }, { id: 'ok', current: true }] };
  const messyEvents = { events: [null, { kind: 'khong-biet', at: 'x' }, { kind: 'code', at: 'khong-phai-ngay' }] };
  const s = toSnapshot(messy, messyEvents, null, FALLBACK);
  assert.deepEqual(s?.devices.map((d) => d.id), ['ok']);
  assert.deepEqual(s?.events.map((e) => [e.kind, e.at]), [['code', 0]], 'ngày hỏng thành 0, không làm sập');
  assert.equal(s?.hasCode, false);
  assert.equal(s?.unseen, false);

  for (const bad of [null, {}, { sessions: 'x' }, 5]) assert.equal(toSnapshot(bad, events, {}, FALLBACK), null);
  assert.deepEqual(toSnapshot(sessions, null, null, FALLBACK)?.events, []);
});

test('nhánh màn hết phiên: A khi còn mã hoặc còn thiết bị khác, B khi không còn gì (hoặc chưa biết gì)', () => {
  assert.equal(expiredBranch({ hasCode: true, deviceCount: 1 }), 'A');
  assert.equal(expiredBranch({ hasCode: false, deviceCount: 2 }), 'A');
  assert.equal(expiredBranch({ hasCode: false, deviceCount: 1 }), 'B');
  assert.equal(expiredBranch(null), 'B');
});
