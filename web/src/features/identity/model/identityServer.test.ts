import test from 'node:test';
import assert from 'node:assert/strict';
import { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import type { RandomSource } from '../../../shared/domain/RecoveryCode.ts';
import { IDENTITY } from './identity.const.ts';
import {
  INITIAL_SERVER as S0, addDevice, answerPairing, expiredBranch, checkCode, clearPairing, commitCode, createIdentity, decidePairing, fakeHash, findPairing, hasCode, markSeen, matchChoices, pairingExpired, requestPairing, revokeDevice,
} from './identityServer.ts';

const T0 = 1_000_000;

/** Nguồn ngẫu nhiên tăng dần để test xác định. */
function counter(): RandomSource {
  let n = 0;
  return {
    fill(bytes) {
      bytes.forEach((_, i) => {
        bytes[i] = (n += 7) % 256;
      });
    },
  };
}

/** Mã khôi phục cố định. */
const CODE = RecoveryCode.parse('0123456789ABCDEFGHJKMNPQRSTVWX')!;

test('băm giả ổn định, khác nhau theo đầu vào và không chứa mã gốc', () => {
  assert.equal(fakeHash('ABC'), fakeHash('ABC'));
  assert.notEqual(fakeHash('ABC'), fakeHash('ABD'));
  assert.ok(!fakeHash(CODE.normalized).includes(CODE.normalized.slice(0, 8)));
});

test('tạo danh tính: một thiết bị, chưa có mã, ghi sự kiện', () => {
  const s = createIdentity(S0, 'd1', 'Máy này', T0);
  assert.equal(s.identity?.devices.length, 1);
  assert.equal(hasCode(s), false);
  assert.deepEqual(s.identity?.events.map((e) => e.kind), ['created']);
});

test('mã chỉ có hiệu lực sau commit; chuẩn hóa O/I/L, gạch, chữ thường; mã sai không khớp', () => {
  let s = createIdentity(S0, 'd1', 'Máy này', T0);
  assert.equal(checkCode(s, CODE.format()), false, 'chưa commit thì chưa có mã hiệu lực');
  s = commitCode(s, CODE, T0 + 1);
  assert.equal(hasCode(s), true);
  assert.equal(checkCode(s, CODE.format()), true);
  assert.equal(checkCode(s, CODE.format().toLowerCase().replace(/-/g, ' ')), true);
  assert.equal(checkCode(s, '00000-00000-00000-00000-00000-00000'), false);
  assert.equal(checkCode(s, 'sai'), false);
});

test('mã mới thay mã cũ trong MỘT lần commit: mã cũ hết hiệu lực', () => {
  let s = commitCode(createIdentity(S0, 'd1', 'Máy này', T0), CODE, T0);
  const next = RecoveryCode.generate(counter());
  s = commitCode(s, next, T0 + 5);
  assert.equal(checkCode(s, CODE.format()), false);
  assert.equal(checkCode(s, next.format()), true);
});

test('thêm/thu hồi thiết bị ghi sự kiện, bật "chưa xem" khi thêm; đánh dấu đã xem', () => {
  let s = createIdentity(S0, 'd1', 'Máy này', T0);
  s = addDevice(s, { id: 'd2', name: 'Máy tính bảng', at: T0 }, 'paired', T0 + 1);
  assert.equal(s.identity?.unseen, true);
  assert.equal(s.identity?.devices.length, 2);
  s = markSeen(s);
  assert.equal(s.identity?.unseen, false);
  s = revokeDevice(s, 'd2', T0 + 2);
  assert.deepEqual(s.identity?.devices.map((d) => d.id), ['d1']);
  assert.deepEqual(s.identity?.events.slice(0, 2).map((e) => e.kind), ['revoked', 'paired']);
  assert.equal(revokeDevice(s, 'khong-co', T0 + 3), s, 'thiết bị không có thì không đổi');
});

test('xin ghép: mã 8 ký hiệu + số khớp 2 chữ số; tra mã đúng/sai/hết hạn; duyệt rồi xóa', () => {
  const r = requestPairing(S0, 'Điện thoại mới', T0, counter());
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.match(r.pairing.code, /^[0-9A-Z]{8}$/);
  assert.ok(r.pairing.number >= IDENTITY.MATCH_MIN && r.pairing.number <= IDENTITY.MATCH_MAX);
  const found = findPairing(r.state, `${r.pairing.code.slice(0, 4)}-${r.pairing.code.slice(4)}`.toLowerCase(), T0 + 1000);
  assert.equal(found.result, 'found');
  assert.equal(findPairing(r.state, '0000-0000', T0 + 1000).result, 'none');
  assert.equal(findPairing(r.state, r.pairing.code, T0 + IDENTITY.PAIR_TTL_MS).result, 'expired');
  assert.equal(pairingExpired(r.pairing, T0 + IDENTITY.PAIR_TTL_MS - 1), false);
  const approved = decidePairing(r.state, 'approved');
  assert.equal(approved.pairing?.status, 'approved');
  assert.equal(findPairing(approved, r.pairing.code, T0 + 1).result, 'none', 'đã duyệt thì mã không dùng lại được');
  assert.equal(clearPairing(approved).pairing, null);
});

test('hạn mức yêu cầu duyệt: quá 3 yêu cầu trong 10 phút bị chặn, hết cửa sổ thì được lại (DR-018 E1)', () => {
  const random = counter();
  let s = S0;
  for (let i = 0; i < IDENTITY.PAIR_REQUEST_LIMIT; i += 1) {
    const r = requestPairing(s, 'M', T0 + i, random);
    assert.ok(r.ok);
    s = r.state;
  }
  const blocked = requestPairing(s, 'M', T0 + 10, random);
  assert.equal(blocked.ok, false);
  const later = requestPairing(blocked.state, 'M', T0 + IDENTITY.PAIR_REQUEST_WINDOW_MS + IDENTITY.PAIR_REQUEST_LIMIT, random);
  assert.equal(later.ok, true);
});

test('số khớp: đúng 3 lựa chọn khác nhau, luôn chứa số thật', () => {
  for (let i = 0; i < 20; i += 1) {
    const choices = matchChoices(42, counter());
    assert.equal(choices.length, IDENTITY.MATCH_OPTIONS);
    assert.equal(new Set(choices).size, IDENTITY.MATCH_OPTIONS);
    assert.ok(choices.includes(42));
  }
});

test('trả lời yêu cầu ghép bằng số khớp: đúng số duyệt, sai số hoặc từ chối thì từ chối, hết hạn/đã xử lý thì báo hết hạn (DR-018 E1)', () => {
  const r = requestPairing(S0, 'Máy mới', T0, counter());
  assert.ok(r.ok);
  if (!r.ok) return;
  const real = r.pairing.number;
  const wrongNumber = real === IDENTITY.MATCH_MIN ? real + 1 : real - 1;
  assert.deepEqual([answerPairing(r.state, real, T0 + 1).outcome, answerPairing(r.state, real, T0 + 1).state.pairing?.status], ['approved', 'approved']);
  assert.deepEqual([answerPairing(r.state, wrongNumber, T0 + 1).outcome, answerPairing(r.state, wrongNumber, T0 + 1).state.pairing?.status], ['wrong', 'denied']);
  assert.equal(answerPairing(r.state, null, T0 + 1).outcome, 'denied');
  assert.equal(answerPairing(r.state, real, T0 + IDENTITY.PAIR_TTL_MS).outcome, 'expired');
  assert.equal(answerPairing(answerPairing(r.state, real, T0 + 1).state, real, T0 + 2).outcome, 'expired', 'đã duyệt thì không duyệt lại');
  assert.equal(answerPairing(S0, real, T0).outcome, 'expired', 'không có yêu cầu nào');
});

test('nhánh hết phiên: còn mã hoặc còn thiết bị thì A; hết cả hai (hoặc chưa có danh tính) thì B', () => {
  assert.equal(expiredBranch(S0), 'B');
  const solo = createIdentity(S0, 'd1', 'Máy này', T0);
  assert.equal(expiredBranch(revokeDevice(solo, 'd1', T0 + 1)), 'B', 'mất thiết bị duy nhất, chưa có mã');
  assert.equal(expiredBranch(revokeDevice(commitCode(solo, CODE, T0), 'd1', T0 + 1)), 'A', 'còn mã khôi phục');
  assert.equal(expiredBranch(revokeDevice(addDevice(solo, { id: 'd2', name: 'Máy 2', at: T0 }, 'paired', T0), 'd1', T0 + 1)), 'A', 'còn thiết bị khác');
});
