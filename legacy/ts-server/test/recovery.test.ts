// Kiểm thử xác thực/khôi phục theo D20–D26 và các invariant INV/NEG trong docs/autopilot/q16-design-draft.md.
// Lưu ý: đây là test của phần cài đặt; chúng KHÔNG xác minh G7 (G7 cần mô hình đe dọa, tiêu chí đo được và người dùng thật).
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { withApp } from './helpers.ts';
import type { Res } from './helpers.ts';

const newToken = () => randomBytes(32).toString('base64url');
const attemptId = () => randomBytes(16).toString('base64url');

type App = Parameters<Parameters<typeof withApp>[0]>[0];

async function startRecovery(a: App, code: string, token = newToken(), attempt = attemptId()) {
  const r = await a.call('POST', '/api/recovery/start', undefined, { code, attemptId: attempt, sessionToken: token });
  return { r, token, attempt };
}

async function completeRecovery(a: App, attempt: string, replacementCode: string): Promise<Res> {
  return a.call('POST', '/api/recovery/complete', undefined, { attemptId: attempt, replacementCode });
}

/** Khôi phục trọn vẹn: trả về token phiên mới và mã thay thế (mã hiện hành sau khôi phục). */
async function recoverFully(a: App, code: string) {
  const { r, token, attempt } = await startRecovery(a, code);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const done = await completeRecovery(a, attempt, r.body.replacementCode);
  assert.equal(done.status, 200, JSON.stringify(done.body));
  return { token, newCode: r.body.replacementCode as string };
}

function activeCodes(a: App, identityId: string): number {
  return (a.db.prepare('SELECT COUNT(*) AS n FROM recovery_codes WHERE identity_id = ? AND invalidated_at IS NULL').get(identityId) as { n: number }).n;
}

// ---- Phát hành mã ban đầu (D26) ----

test('D26: mã khôi phục hiển thị một lần khi tạo danh tính, chỉ lưu băm, không dùng làm bearer', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    assert.match(u.recoveryCode!, /^([0-9A-HJKMNP-TV-Z]{5}-){5}[0-9A-HJKMNP-TV-Z]{5}$/);
    const rows = a.db.prepare('SELECT code_hash FROM recovery_codes').all() as { code_hash: string }[];
    assert.equal(rows.length, 1);
    assert.match(rows[0]!.code_hash, /^[0-9a-f]{64}$/);
    assert.ok(!JSON.stringify(rows).includes(u.recoveryCode!.replace(/-/g, '')));
    // INV-17: mã khôi phục không phải bằng chứng phiên
    assert.equal((await a.call('GET', '/api/trips', u.recoveryCode!.replace(/-/g, ''))).status, 401);
    assert.deepEqual((await a.call('GET', '/api/recovery-code', u.token)).body.hasCode, true);
  });
});

test('D26: được bỏ qua mã khi tạo danh tính (khi đó chưa có mã)', async () => {
  await withApp(async (a) => {
    const r = await a.call('POST', '/api/identity', undefined, { skipRecoveryCode: true });
    assert.equal(r.status, 201);
    assert.equal(r.body.recoveryCode, null);
    assert.equal((await a.call('GET', '/api/recovery-code', r.body.token)).body.hasCode, false);
  });
});

test('INV-17/D22: tạo thêm chuyến không phát hành hay đổi mã khôi phục', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const before = a.db.prepare('SELECT id, code_hash FROM recovery_codes').all();
    await a.newTrip(u.token);
    await a.newTrip(u.token, { name: 'Chuyến thứ hai' });
    assert.deepEqual(a.db.prepare('SELECT id, code_hash FROM recovery_codes').all(), before);
    // một mã mở lại được mọi chuyến của danh tính
    const { token } = await recoverFully(a, u.recoveryCode!);
    assert.equal(((await a.call('GET', '/api/trips', token)).body.trips as unknown[]).length, 2);
  });
});

// ---- Khôi phục bằng mã (KP-C, D24) ----

test('KP-C: khôi phục thành công mở lại dữ liệu trên thiết bị mới; phiên cũ không bị thu hồi (D23, INV-10)', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const tripId = await a.newTrip(u.token);
    await a.newItem(u.token, tripId, { title: 'Giữ nguyên', cost: 70 });

    const { token } = await recoverFully(a, u.recoveryCode!);
    const detail = await a.call('GET', `/api/trips/${tripId}`, token);
    assert.equal(detail.status, 200);
    assert.equal(detail.body.days[1].items[0].title, 'Giữ nguyên');
    // phiên cũ của chủ vẫn hoạt động và thấy phiên mới
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, u.token)).status, 200);
    const sessions = (await a.call('GET', '/api/sessions', u.token)).body.sessions as { current: boolean }[];
    assert.equal(sessions.length, 2);
    assert.equal(sessions.filter((s) => s.current).length, 1);
  });
});

test('KP-C/INV-7: mã cũ không dùng lại được sau khi khôi phục; mã thay thế là mã hiện hành duy nhất', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const { newCode } = await recoverFully(a, u.recoveryCode!);
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.body.error.code, 'INVALID_CODE');
    assert.equal(activeCodes(a, u.identityId), 1);
    // chuỗi khôi phục tiếp tục bằng mã thay thế
    const second = await recoverFully(a, newCode);
    assert.equal((await a.call('GET', '/api/trips', second.token)).status, 200);
    assert.equal((await startRecovery(a, newCode)).r.body.error.code, 'INVALID_CODE');
    assert.equal(activeCodes(a, u.identityId), 1);
  });
});

test('INV-15/NEG-16: trước khi commit, bí mật phiên đang chờ không truy cập được gì; mã cũ chưa bị tiêu thụ', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    await a.newTrip(u.token);
    const s = await startRecovery(a, u.recoveryCode!);
    assert.equal(s.r.status, 200);
    assert.equal((await a.call('GET', '/api/trips', s.token)).status, 401);
    // mã cũ vẫn hợp lệ: bắt đầu một lần thử khác được
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.status, 200);
    assert.equal(activeCodes(a, u.identityId), 1);
  });
});

test('INV-16/NEG-17: mã thay thế chưa xác nhận không được chấp nhận làm bằng chứng', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const s = await startRecovery(a, u.recoveryCode!);
    const replacement = s.r.body.replacementCode as string;
    assert.equal((await startRecovery(a, replacement)).r.body.error.code, 'INVALID_CODE');
    assert.equal((await a.call('GET', '/api/trips', replacement.replace(/-/g, ''))).status, 401);
  });
});

test('D24: không hoàn tất được nếu không xác nhận đúng mã thay thế; thất bại không làm mất mã cũ (NEG-13)', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const s = await startRecovery(a, u.recoveryCode!);
    const wrong = await completeRecovery(a, s.attempt, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA');
    assert.equal(wrong.status, 400);
    assert.equal(wrong.body.error.code, 'INVALID_REPLACEMENT');
    assert.equal((await completeRecovery(a, s.attempt, 'sai-dinh-dang')).body.error.code, 'INVALID_REPLACEMENT');
    assert.equal((await a.call('GET', '/api/trips', s.token)).status, 401);
    assert.equal(activeCodes(a, u.identityId), 1);
    // mã cũ còn nguyên, khôi phục lại từ đầu được
    const again = await recoverFully(a, u.recoveryCode!);
    assert.equal((await a.call('GET', '/api/trips', again.token)).status, 200);
  });
});

test('INV-12/NEG-11: gửi lại cùng lần thử sau commit là idempotent, không tạo thêm phiên hay mã', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const s = await startRecovery(a, u.recoveryCode!);
    const replacement = s.r.body.replacementCode as string;
    assert.equal((await completeRecovery(a, s.attempt, replacement)).status, 200);
    // mất phản hồi: thiết bị gửi lại
    const retry = await completeRecovery(a, s.attempt, replacement);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.committed, true);
    assert.equal((a.db.prepare('SELECT COUNT(*) AS n FROM sessions WHERE identity_id = ?').get(u.identityId) as { n: number }).n, 2);
    assert.equal(activeCodes(a, u.identityId), 1);
    assert.equal((await a.call('GET', '/api/trips', s.token)).status, 200);
    // lần thử khác với mã đã tiêu thụ bị từ chối
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.body.error.code, 'INVALID_CODE');
  });
});

test('INV-7/NEG-10: hai lần thử đồng thời cùng một mã: đúng một lần commit, lần còn lại thất bại', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const first = await startRecovery(a, u.recoveryCode!);
    const second = await startRecovery(a, u.recoveryCode!);
    assert.equal(first.r.status, 200);
    assert.equal(second.r.status, 200);

    assert.equal((await completeRecovery(a, first.attempt, first.r.body.replacementCode)).status, 200);
    const late = await completeRecovery(a, second.attempt, second.r.body.replacementCode);
    assert.equal(late.status, 409);
    assert.equal(late.body.error.code, 'CODE_ALREADY_USED');
    assert.equal((await a.call('GET', '/api/trips', second.token)).status, 401);
    assert.equal((await a.call('GET', '/api/trips', first.token)).status, 200);
    // mã thay thế của lần thua không bao giờ hợp lệ
    assert.equal((await startRecovery(a, second.r.body.replacementCode)).r.body.error.code, 'INVALID_CODE');
    assert.equal(activeCodes(a, u.identityId), 1);
  });
});

test('MĐ-6: lần thử chờ hết hạn thì không commit được và mã hiện tại vẫn dùng được', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const s = await startRecovery(a, u.recoveryCode!);
    a.db.prepare("UPDATE recovery_attempts SET expires_at = '2020-01-01T00:00:00.000Z'").run();
    const late = await completeRecovery(a, s.attempt, s.r.body.replacementCode);
    assert.equal(late.status, 400);
    assert.equal(late.body.error.code, 'ATTEMPT_EXPIRED');
    assert.equal((await a.call('GET', '/api/trips', s.token)).status, 401);
    assert.equal((await recoverFully(a, u.recoveryCode!)).token.length > 0, true);
  });
});

test('MĐ-6: bắt đầu lại cùng lần thử cấp mã thay thế mới và vô hiệu mã thay thế trước đó', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const token = newToken();
    const attempt = attemptId();
    const one = await startRecovery(a, u.recoveryCode!, token, attempt);
    const two = await startRecovery(a, u.recoveryCode!, token, attempt);
    assert.equal(two.r.status, 200);
    assert.notEqual(one.r.body.replacementCode, two.r.body.replacementCode);
    assert.equal((await completeRecovery(a, attempt, one.r.body.replacementCode)).body.error.code, 'INVALID_REPLACEMENT');
    assert.equal((await completeRecovery(a, attempt, two.r.body.replacementCode)).status, 200);
    // người khác không chiếm được lần thử bằng cách dùng lại mã nhận diện với bí mật khác
    const hijack = await startRecovery(a, u.recoveryCode!, newToken(), attempt);
    assert.equal(hijack.r.status, 400);
  });
});

test('INV-6/MĐ-8: mọi lý do từ chối mã cho cùng một phản hồi; bí mật phiên phải đủ mạnh', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const unknownButValid = await startRecovery(a, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA');
    const garbage = await startRecovery(a, 'khong phai ma');
    const missing = await a.call('POST', '/api/recovery/start', undefined, { attemptId: attemptId(), sessionToken: newToken() });
    assert.equal(unknownButValid.r.status, 400);
    assert.deepEqual(unknownButValid.r.body, garbage.r.body);
    assert.deepEqual(unknownButValid.r.body, missing.body);
    // bí mật phiên yếu hoặc dùng lại
    const weak = await a.call('POST', '/api/recovery/start', undefined, { code: u.recoveryCode, attemptId: attemptId(), sessionToken: 'ngan' });
    assert.equal(weak.body.error.code, 'INVALID_SESSION_TOKEN');
    const reuse = await a.call('POST', '/api/recovery/start', undefined, { code: u.recoveryCode, attemptId: attemptId(), sessionToken: u.token });
    assert.equal(reuse.body.error.code, 'INVALID_SESSION_TOKEN');
  });
});

test('Q16 câu 6: giới hạn tần suất các điểm cuối khôi phục theo địa chỉ', async () => {
  await withApp(
    async (a) => {
      for (let i = 0; i < 3; i++) assert.equal((await startRecovery(a, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA')).r.status, 400);
      const limited = await startRecovery(a, 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA');
      assert.equal(limited.r.status, 429);
      assert.equal(limited.r.body.error.code, 'RATE_LIMITED');
    },
    { recoveryLimitPerHour: 3 },
  );
});

// ---- Thiết bị tin cậy duyệt thiết bị mới (D21) ----

test('D21: thiết bị tin cậy duyệt thiết bị mới; thiết bị mới tự giữ bí mật phiên', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const tripId = await a.newTrip(u.token);
    const newDeviceToken = newToken();
    const link = await a.call('POST', '/api/device-links', undefined, { sessionToken: newDeviceToken });
    assert.equal(link.status, 201);
    assert.match(link.body.pairingCode, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    assert.equal((await a.call('GET', `/api/device-links/${link.body.requestId}`)).body.status, 'pending');
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, newDeviceToken)).status, 401); // chưa duyệt

    assert.equal((await a.call('POST', '/api/device-links/approve', u.token, { pairingCode: link.body.pairingCode })).status, 200);
    assert.equal((await a.call('GET', `/api/device-links/${link.body.requestId}`)).body.status, 'approved');
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, newDeviceToken)).status, 200);
    // mã ghép chỉ dùng một lần
    assert.equal((await a.call('POST', '/api/device-links/approve', u.token, { pairingCode: link.body.pairingCode })).body.error.code, 'INVALID_PAIRING_CODE');
  });
});

test('D21: mã ghép sai, hết hạn hoặc không có phiên đều bị từ chối', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const link = await a.call('POST', '/api/device-links', undefined, { sessionToken: newToken() });
    assert.equal((await a.call('POST', '/api/device-links/approve', u.token, { pairingCode: 'AAAA-AAAA' })).body.error.code, 'INVALID_PAIRING_CODE');
    assert.equal((await a.call('POST', '/api/device-links/approve', undefined, { pairingCode: link.body.pairingCode })).status, 401);
    a.db.prepare("UPDATE device_links SET expires_at = '2020-01-01T00:00:00.000Z'").run();
    assert.equal((await a.call('POST', '/api/device-links/approve', u.token, { pairingCode: link.body.pairingCode })).body.error.code, 'INVALID_PAIRING_CODE');
    assert.equal((await a.call('GET', `/api/device-links/${link.body.requestId}`)).body.status, 'expired');
  });
});

// ---- Phiên: danh sách và thu hồi (INV-2) ----

test('INV-2: chủ thu hồi một phiên khác thì phiên đó mất quyền ngay; không thu hồi được phiên của người khác', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const other = await a.newUser();
    const tripId = await a.newTrip(u.token);
    const { token: lostDevice } = await recoverFully(a, u.recoveryCode!);
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, lostDevice)).status, 200);

    const sessions = (await a.call('GET', '/api/sessions', u.token)).body.sessions as { id: string; current: boolean }[];
    const target = sessions.find((s) => !s.current)!;
    assert.equal((await a.call('DELETE', `/api/sessions/${target.id}`, u.token)).status, 204);
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, lostDevice)).status, 401);
    assert.equal((await a.call('POST', `/api/trips/${tripId}/items`, lostDevice, { day: '2026-08-30', type: 'food', title: 'x' })).status, 401);
    // danh tính khác không thu hồi được phiên này
    const mine = (await a.call('GET', '/api/sessions', u.token)).body.sessions as { id: string }[];
    assert.equal((await a.call('DELETE', `/api/sessions/${mine[0]!.id}`, other.token)).status, 404);
    assert.equal((await a.call('GET', `/api/trips/${tripId}`, u.token)).status, 200);
  });
});

// ---- Tái tạo mã và xác thực lại (D23, D25, MĐ-1, MĐ-2) ----

test('D25/INV-14/NEG-12: tái tạo mã bị từ chối nếu không xác thực lại, dù phiên hợp lệ', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const none = await a.call('POST', '/api/recovery-code/begin', u.token, {});
    assert.equal(none.status, 403);
    assert.equal(none.body.error.code, 'STEP_UP_REQUIRED');
    const wrongCode = await a.call('POST', '/api/recovery-code/begin', u.token, {
      evidence: { type: 'code', code: 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA' },
    });
    assert.equal(wrongCode.status, 403);
    assert.equal((await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'approval', requestId: 'khong-co' } })).status, 403);
    assert.equal((await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'khac' } })).status, 403);
    assert.equal(activeCodes(a, u.identityId), 1);
  });
});

test('D23/INV-13: tái tạo mã hai pha: mã cũ chỉ vô hiệu khi mã mới được xác nhận', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const begin = await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'code', code: u.recoveryCode } });
    assert.equal(begin.status, 200, JSON.stringify(begin.body));
    const { pendingId, replacementCode } = begin.body;

    // chưa xác nhận: mã cũ còn dùng được, mã mới chưa dùng được
    assert.equal(activeCodes(a, u.identityId), 1);
    assert.equal((await startRecovery(a, replacementCode)).r.body.error.code, 'INVALID_CODE');
    assert.equal((await a.call('POST', '/api/recovery-code/confirm', u.token, { pendingId, replacementCode: 'AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA' })).body.error.code, 'INVALID_REPLACEMENT');
    assert.equal(activeCodes(a, u.identityId), 1);
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.status, 200);

    const confirm = await a.call('POST', '/api/recovery-code/confirm', u.token, { pendingId, replacementCode });
    assert.equal(confirm.status, 200);
    assert.equal(activeCodes(a, u.identityId), 1);
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.body.error.code, 'INVALID_CODE'); // NEG-6
    assert.equal((await startRecovery(a, replacementCode)).r.status, 200);
  });
});

test('INV-13/NEG-13: bắt đầu tái tạo lại thì mã thay thế chờ trước đó bị vô hiệu; hết hạn thì không commit', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const ev = { evidence: { type: 'code', code: u.recoveryCode } };
    const one = await a.call('POST', '/api/recovery-code/begin', u.token, ev);
    const two = await a.call('POST', '/api/recovery-code/begin', u.token, ev);
    assert.equal((await a.call('POST', '/api/recovery-code/confirm', u.token, { pendingId: one.body.pendingId, replacementCode: one.body.replacementCode })).status, 404);
    a.db.prepare("UPDATE code_replacements SET expires_at = '2020-01-01T00:00:00.000Z'").run();
    assert.equal((await a.call('POST', '/api/recovery-code/confirm', u.token, { pendingId: two.body.pendingId, replacementCode: two.body.replacementCode })).body.error.code, 'ATTEMPT_EXPIRED');
    assert.equal((await startRecovery(a, u.recoveryCode!)).r.status, 200); // mã cũ còn nguyên
  });
});

test('INV-13: mã đổi trong lúc chờ (đã khôi phục ở nơi khác) thì xác nhận thất bại, không có hai mã hợp lệ', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const begin = await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'code', code: u.recoveryCode } });
    await recoverFully(a, u.recoveryCode!);
    const confirm = await a.call('POST', '/api/recovery-code/confirm', u.token, { pendingId: begin.body.pendingId, replacementCode: begin.body.replacementCode });
    assert.equal(confirm.status, 409);
    assert.equal(confirm.body.error.code, 'CODE_CHANGED');
    assert.equal(activeCodes(a, u.identityId), 1);
    assert.equal((await startRecovery(a, begin.body.replacementCode)).r.body.error.code, 'INVALID_CODE');
  });
});

test('MĐ-1: xác thực lại bằng phê duyệt từ thiết bị khác; bằng chứng dùng một lần, gắn với đúng phiên', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const device2 = (await recoverFully(a, u.recoveryCode!)).token;

    const req = await a.call('POST', '/api/step-up/requests', u.token, { operation: 'regenerate_code' });
    assert.equal(req.status, 201);
    // phiên đang xin không tự duyệt chính nó
    assert.equal((await a.call('POST', '/api/step-up/approve', u.token, { approvalCode: req.body.approvalCode })).body.error.code, 'INVALID_APPROVAL_CODE');
    // chưa duyệt thì chưa dùng được
    assert.equal((await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'approval', requestId: req.body.requestId } })).status, 403);
    // người khác (danh tính khác) không duyệt được
    const stranger = await a.newUser();
    assert.equal((await a.call('POST', '/api/step-up/approve', stranger.token, { approvalCode: req.body.approvalCode })).status, 400);

    assert.equal((await a.call('POST', '/api/step-up/approve', device2, { approvalCode: req.body.approvalCode })).status, 200);
    // phiên khác không dùng được bằng chứng của phiên xin
    assert.equal((await a.call('POST', '/api/recovery-code/begin', device2, { evidence: { type: 'approval', requestId: req.body.requestId } })).status, 403);
    const ok = await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'approval', requestId: req.body.requestId } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    // dùng một lần
    assert.equal((await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'approval', requestId: req.body.requestId } })).status, 403);
    assert.equal((await a.call('POST', '/api/step-up/requests', u.token, { operation: 'xoa_ca_chuyen' })).body.error.code, 'INVALID_OPERATION');
  });
});

test('MĐ-2/NEG-19: danh tính chưa có mã phát hành mã lần đầu chỉ bằng phiên hợp lệ; sau đó phải xác thực lại', async () => {
  await withApp(async (a) => {
    const r = await a.call('POST', '/api/identity', undefined, { skipRecoveryCode: true });
    const token = r.body.token as string;
    const begin = await a.call('POST', '/api/recovery-code/begin', token, {});
    assert.equal(begin.status, 200, JSON.stringify(begin.body));
    assert.equal((await a.call('POST', '/api/recovery-code/confirm', token, { pendingId: begin.body.pendingId, replacementCode: begin.body.replacementCode })).status, 200);
    assert.equal((await a.call('GET', '/api/recovery-code', token)).body.hasCode, true);
    assert.equal((await a.call('POST', '/api/recovery-code/begin', token, {})).status, 403);
    // và mã mới khôi phục được
    assert.equal((await recoverFully(a, begin.body.replacementCode)).token.length > 0, true);
  });
});

test('quyền sở hữu mã chờ: danh tính khác không xác nhận được mã thay thế của người khác', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    const stranger = await a.newUser();
    const begin = await a.call('POST', '/api/recovery-code/begin', u.token, { evidence: { type: 'code', code: u.recoveryCode } });
    const r = await a.call('POST', '/api/recovery-code/confirm', stranger.token, { pendingId: begin.body.pendingId, replacementCode: begin.body.replacementCode });
    assert.equal(r.status, 404);
    assert.equal(activeCodes(a, u.identityId), 1);
  });
});

test('INV-13 (mức cơ sở dữ liệu): không thể có hai mã hợp lệ cho cùng một danh tính', async () => {
  await withApp(async (a) => {
    const u = await a.newUser();
    assert.throws(() =>
      a.db
        .prepare("INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) VALUES ('x', ?, 'h', '2026-01-01T00:00:00.000Z')")
        .run(u.identityId),
    );
  });
});
