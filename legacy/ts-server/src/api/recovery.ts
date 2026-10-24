// Khôi phục quyền chủ chuyến theo D20–D26 và bản thiết kế docs/autopilot/q16-design-draft.md.
// RELEASE GATE RG-1: thiết kế chưa được Product Owner duyệt; không phát hành cho người dùng thật.
// Các mặc định MĐ-1…MĐ-8 trong bản thiết kế là PROPOSED; mã bám sát chúng và sẽ đổi theo kết quả duyệt.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { SESSION_TOKEN_PATTERN, hashToken, insertSession } from './auth.ts';
import type { AuthContext } from './auth.ts';
import { tx } from './db.ts';
import { ApiError, badRequest, conflict, notFound } from './errors.ts';

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32: không có I, L, O, U
export const RECOVERY_CODE_SYMBOLS = 30; // 150 bit; mã tự chứa thông tin tìm ra danh tính (MĐ-8)
export const SHORT_CODE_SYMBOLS = 8;

/** Hạn của lần thử khôi phục chờ và của mã thay thế chưa xác nhận (MĐ-6). Giá trị cụ thể: chờ spec. */
export const PENDING_TTL_MS = 15 * 60_000;
/** Hạn của yêu cầu ghép thiết bị và yêu cầu phê duyệt xác thực lại. */
export const APPROVAL_TTL_MS = 5 * 60_000;

const nowIso = () => new Date().toISOString();
const inMs = (ms: number) => new Date(Date.now() + ms).toISOString();

function randomSymbols(n: number): string {
  let s = '';
  for (const b of randomBytes(n)) s += ALPHABET[b & 31]; // 256 chia hết cho 32 nên phân bố đều
  return s;
}

export function generateRecoveryCode(): string {
  return randomSymbols(RECOVERY_CODE_SYMBOLS).match(/.{5}/g)!.join('-');
}

function generateShortCode(): string {
  const s = randomSymbols(SHORT_CODE_SYMBOLS);
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export function normalizeCode(input: unknown, symbols: number): string | null {
  if (typeof input !== 'string' || input.length > 80) return null;
  const s = input.toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  if (s.length !== symbols) return null;
  for (const ch of s) if (!ALPHABET.includes(ch)) return null;
  return s;
}

const recoveryHash = (normalized: string) => createHash('sha256').update(`wander-recovery-v1:${normalized}`).digest('hex');

const INVALID_CODE = () => new ApiError(400, 'INVALID_CODE', 'Mã không hợp lệ hoặc đã được dùng.');

// ---------- Phát hành mã ban đầu (D26) ----------

export function issueInitialCode(db: DatabaseSync, identityId: string): string {
  const code = generateRecoveryCode();
  db.prepare('INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) VALUES (?, ?, ?, ?)').run(
    randomUUID(),
    identityId,
    recoveryHash(normalizeCode(code, RECOVERY_CODE_SYMBOLS)!),
    nowIso(),
  );
  return code;
}

function activeCode(db: DatabaseSync, identityId: string): { id: string; created_at: string } | undefined {
  return db.prepare('SELECT id, created_at FROM recovery_codes WHERE identity_id = ? AND invalidated_at IS NULL').get(identityId) as
    | { id: string; created_at: string }
    | undefined;
}

export function recoveryCodeStatus(db: DatabaseSync, identityId: string): { hasCode: boolean; createdAt: string | null } {
  const c = activeCode(db, identityId);
  return { hasCode: c !== undefined, createdAt: c?.created_at ?? null };
}

// ---------- Khôi phục bằng mã (KP-C, D24) ----------

function validateAttemptKey(v: unknown): string {
  if (typeof v !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(v)) {
    throw badRequest('INVALID_ATTEMPT', 'Mã nhận diện lần thử không hợp lệ.', 'attemptId');
  }
  return v;
}

function validateSessionToken(v: unknown): string {
  if (typeof v !== 'string' || !SESSION_TOKEN_PATTERN.test(v)) {
    throw badRequest('INVALID_SESSION_TOKEN', 'Bí mật phiên không hợp lệ.', 'sessionToken');
  }
  return v;
}

function tokenHashInUse(db: DatabaseSync, tokenHash: string): boolean {
  return (
    db.prepare('SELECT 1 FROM sessions WHERE token_hash = ?').get(tokenHash) !== undefined ||
    db.prepare("SELECT 1 FROM recovery_attempts WHERE session_token_hash = ? AND state = 'pending'").get(tokenHash) !== undefined ||
    db.prepare("SELECT 1 FROM device_links WHERE session_token_hash = ? AND state = 'pending'").get(tokenHash) !== undefined
  );
}

/**
 * Bước 1–2: kiểm tra mã hiện hành, tạo lần thử chờ và phát hành mã thay thế (chưa hợp lệ).
 * Mã cũ CHƯA bị tiêu thụ. Chưa có phiên nào được tạo (INV-15).
 */
export function startRecovery(db: DatabaseSync, input: Record<string, unknown>): { attemptId: string; replacementCode: string; expiresAt: string } {
  const attemptKey = validateAttemptKey(input['attemptId']);
  const sessionToken = validateSessionToken(input['sessionToken']);
  const normalized = normalizeCode(input['code'], RECOVERY_CODE_SYMBOLS);
  if (normalized === null) throw INVALID_CODE();

  return tx(db, () => {
    const old = db
      .prepare('SELECT id, identity_id FROM recovery_codes WHERE code_hash = ? AND invalidated_at IS NULL')
      .get(recoveryHash(normalized)) as { id: string; identity_id: string } | undefined;
    if (!old) throw INVALID_CODE();

    const tokenHash = hashToken(sessionToken);
    const replacement = generateRecoveryCode();
    const replacementHash = recoveryHash(normalizeCode(replacement, RECOVERY_CODE_SYMBOLS)!);
    const expiresAt = inMs(PENDING_TTL_MS);

    const existing = db.prepare('SELECT id, old_code_id, state, session_token_hash FROM recovery_attempts WHERE attempt_key = ?').get(attemptKey) as
      | { id: string; old_code_id: string; state: string; session_token_hash: string }
      | undefined;
    if (existing) {
      // Cùng lần thử bắt đầu lại (MĐ-6): chỉ cho chính bên đã tạo (cùng mã, cùng bí mật phiên); mã thay thế trước đó bị vô hiệu.
      if (existing.state !== 'pending' || existing.old_code_id !== old.id || existing.session_token_hash !== tokenHash) {
        throw INVALID_CODE();
      }
      db.prepare('UPDATE recovery_attempts SET replacement_hash = ?, expires_at = ? WHERE id = ?').run(replacementHash, expiresAt, existing.id);
      return { attemptId: attemptKey, replacementCode: replacement, expiresAt };
    }

    if (tokenHashInUse(db, tokenHash)) throw badRequest('INVALID_SESSION_TOKEN', 'Bí mật phiên đã được dùng.', 'sessionToken');
    db.prepare(
      `INSERT INTO recovery_attempts (id, attempt_key, identity_id, old_code_id, replacement_hash, session_token_hash, state, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(randomUUID(), attemptKey, old.identity_id, old.id, replacementHash, tokenHash, nowIso(), expiresAt);
    return { attemptId: attemptKey, replacementCode: replacement, expiresAt };
  });
}

/**
 * Bước 3–4: chủ nhập lại mã thay thế (xác nhận), rồi commit nguyên tử:
 * vô hiệu mã cũ + kích hoạt mã thay thế + tạo phiên (INV-11). Không thu hồi phiên nào khác (D23, INV-10).
 * Gọi lại sau commit với cùng lần thử là idempotent (INV-12).
 */
export function completeRecovery(db: DatabaseSync, input: Record<string, unknown>): { committed: true } {
  const attemptKey = validateAttemptKey(input['attemptId']);
  const replacementNorm = normalizeCode(input['replacementCode'], RECOVERY_CODE_SYMBOLS);
  if (replacementNorm === null) throw new ApiError(400, 'INVALID_REPLACEMENT', 'Mã thay thế không đúng.');
  const replacementHash = recoveryHash(replacementNorm);

  return tx(db, () => {
    const a = db.prepare('SELECT * FROM recovery_attempts WHERE attempt_key = ?').get(attemptKey) as
      | {
          id: string;
          identity_id: string;
          old_code_id: string;
          replacement_hash: string;
          session_token_hash: string;
          state: string;
          expires_at: string;
        }
      | undefined;
    if (!a) throw INVALID_CODE();
    if (a.replacement_hash !== replacementHash) throw new ApiError(400, 'INVALID_REPLACEMENT', 'Mã thay thế không đúng.');
    if (a.state === 'committed') return { committed: true as const };
    if (a.state !== 'pending') throw INVALID_CODE();
    if (a.expires_at <= nowIso()) {
      db.prepare("UPDATE recovery_attempts SET state = 'expired' WHERE id = ?").run(a.id);
      throw new ApiError(400, 'ATTEMPT_EXPIRED', 'Lần khôi phục đã hết hạn. Hãy bắt đầu lại; mã hiện tại của bạn vẫn dùng được.');
    }
    const stillActive = db.prepare('SELECT 1 FROM recovery_codes WHERE id = ? AND invalidated_at IS NULL').get(a.old_code_id);
    if (!stillActive) {
      db.prepare("UPDATE recovery_attempts SET state = 'failed' WHERE id = ?").run(a.id);
      throw conflict('CODE_ALREADY_USED', 'Mã này đã được dùng ở một lần khôi phục khác.');
    }
    const t = nowIso();
    db.prepare("UPDATE recovery_codes SET invalidated_at = ?, invalidated_reason = 'recovered' WHERE id = ?").run(t, a.old_code_id);
    db.prepare('INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) VALUES (?, ?, ?, ?)').run(
      randomUUID(),
      a.identity_id,
      a.replacement_hash,
      t,
    );
    insertSession(db, a.identity_id, a.session_token_hash);
    db.prepare("UPDATE recovery_attempts SET state = 'committed' WHERE id = ?").run(a.id);
    return { committed: true as const };
  });
}

// ---------- Thiết bị tin cậy duyệt thiết bị mới (D21) ----------

export function createDeviceLink(db: DatabaseSync, input: Record<string, unknown>): { requestId: string; pairingCode: string; expiresAt: string } {
  const tokenHash = hashToken(validateSessionToken(input['sessionToken']));
  return tx(db, () => {
    if (tokenHashInUse(db, tokenHash)) throw badRequest('INVALID_SESSION_TOKEN', 'Bí mật phiên đã được dùng.', 'sessionToken');
    let pairingCode = generateShortCode();
    while (db.prepare("SELECT 1 FROM device_links WHERE pairing_code = ? AND state = 'pending' AND expires_at > ?").get(pairingCode, nowIso())) {
      pairingCode = generateShortCode();
    }
    const id = randomUUID();
    const expiresAt = inMs(APPROVAL_TTL_MS);
    db.prepare(
      "INSERT INTO device_links (id, pairing_code, session_token_hash, state, created_at, expires_at) VALUES (?, ?, ?, 'pending', ?, ?)",
    ).run(id, pairingCode, tokenHash, nowIso(), expiresAt);
    return { requestId: id, pairingCode, expiresAt };
  });
}

export function deviceLinkStatus(db: DatabaseSync, requestId: string): { status: 'pending' | 'approved' | 'expired' } {
  const row = db.prepare('SELECT state, expires_at FROM device_links WHERE id = ?').get(requestId) as
    | { state: string; expires_at: string }
    | undefined;
  if (!row) throw notFound();
  if (row.state === 'pending' && row.expires_at <= nowIso()) return { status: 'expired' };
  return { status: row.state as 'pending' | 'approved' | 'expired' };
}

/** Thiết bị đã có phiên duyệt thiết bị mới: tạo phiên cho bí mật mà thiết bị mới đã tự sinh. */
export function approveDeviceLink(db: DatabaseSync, auth: AuthContext, input: Record<string, unknown>): { approved: true } {
  const code = normalizeCode(input['pairingCode'], SHORT_CODE_SYMBOLS);
  if (code === null) throw new ApiError(400, 'INVALID_PAIRING_CODE', 'Mã ghép thiết bị không hợp lệ hoặc đã hết hạn.');
  const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
  return tx(db, () => {
    const row = db
      .prepare("SELECT id, session_token_hash FROM device_links WHERE pairing_code = ? AND state = 'pending' AND expires_at > ?")
      .get(formatted, nowIso()) as { id: string; session_token_hash: string } | undefined;
    if (!row) throw new ApiError(400, 'INVALID_PAIRING_CODE', 'Mã ghép thiết bị không hợp lệ hoặc đã hết hạn.');
    insertSession(db, auth.identityId, row.session_token_hash);
    db.prepare("UPDATE device_links SET state = 'approved', identity_id = ? WHERE id = ?").run(auth.identityId, row.id);
    return { approved: true as const };
  });
}

// ---------- Xác thực lại bằng phê duyệt từ thiết bị tin cậy khác (D25, MĐ-1) ----------

export const STEP_UP_OPERATIONS = ['regenerate_code'] as const;
type StepUpOperation = (typeof STEP_UP_OPERATIONS)[number];

export function createStepUpRequest(db: DatabaseSync, auth: AuthContext, input: Record<string, unknown>): { requestId: string; approvalCode: string; expiresAt: string } {
  const op = input['operation'];
  if (typeof op !== 'string' || !(STEP_UP_OPERATIONS as readonly string[]).includes(op)) {
    throw badRequest('INVALID_OPERATION', 'Thao tác không cần xác thực lại.', 'operation');
  }
  const id = randomUUID();
  const approvalCode = generateShortCode();
  const expiresAt = inMs(APPROVAL_TTL_MS);
  db.prepare(
    `INSERT INTO step_up_requests (id, identity_id, session_id, operation, approval_code, state, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
  ).run(id, auth.identityId, auth.sessionId, op, approvalCode, nowIso(), expiresAt);
  return { requestId: id, approvalCode, expiresAt };
}

/** Phải do một phiên KHÁC của cùng danh tính duyệt: phiên đang xin không tự duyệt chính nó. */
export function approveStepUp(db: DatabaseSync, auth: AuthContext, input: Record<string, unknown>): { approved: true } {
  const code = normalizeCode(input['approvalCode'], SHORT_CODE_SYMBOLS);
  const fail = () => new ApiError(400, 'INVALID_APPROVAL_CODE', 'Mã phê duyệt không hợp lệ hoặc đã hết hạn.');
  if (code === null) throw fail();
  const formatted = `${code.slice(0, 4)}-${code.slice(4)}`;
  return tx(db, () => {
    const row = db
      .prepare(
        "SELECT id FROM step_up_requests WHERE approval_code = ? AND identity_id = ? AND session_id != ? AND state = 'pending' AND expires_at > ?",
      )
      .get(formatted, auth.identityId, auth.sessionId, nowIso()) as { id: string } | undefined;
    if (!row) throw fail();
    db.prepare("UPDATE step_up_requests SET state = 'approved', approved_by_session = ? WHERE id = ?").run(auth.sessionId, row.id);
    return { approved: true as const };
  });
}

function consumeStepUp(db: DatabaseSync, auth: AuthContext, requestId: unknown, op: StepUpOperation): void {
  const denied = () => new ApiError(403, 'STEP_UP_REQUIRED', 'Cần xác thực lại để thực hiện thao tác này.');
  if (typeof requestId !== 'string') throw denied();
  const row = db
    .prepare(
      "SELECT id FROM step_up_requests WHERE id = ? AND identity_id = ? AND session_id = ? AND operation = ? AND state = 'approved' AND expires_at > ?",
    )
    .get(requestId, auth.identityId, auth.sessionId, op, nowIso()) as { id: string } | undefined;
  if (!row) throw denied();
  db.prepare("UPDATE step_up_requests SET state = 'consumed' WHERE id = ?").run(row.id);
}

// ---------- Phát hành lần đầu và tái tạo mã từ một phiên hợp lệ (hai pha; D23, D25, MĐ-2) ----------

/**
 * Pha 1: tạo mã thay thế ở trạng thái chờ. Mã hiện hành (nếu có) vẫn hợp lệ cho đến khi pha 2 commit (INV-13).
 * Có mã hiện hành thì bắt buộc xác thực lại: trình mã hiện hành, hoặc phê duyệt từ thiết bị khác.
 * Chưa có mã (đã bỏ qua lúc tạo danh tính, D26) thì chỉ cần phiên hợp lệ (MĐ-2).
 */
export function beginCodeReplacement(db: DatabaseSync, auth: AuthContext, input: Record<string, unknown>): { pendingId: string; replacementCode: string; expiresAt: string } {
  return tx(db, () => {
    const current = activeCode(db, auth.identityId);
    if (current) {
      const ev = input['evidence'];
      const evidence = ev !== null && typeof ev === 'object' ? (ev as Record<string, unknown>) : null;
      const denied = () => new ApiError(403, 'STEP_UP_REQUIRED', 'Cần xác thực lại để tạo mã mới.');
      if (!evidence) throw denied();
      if (evidence['type'] === 'code') {
        const n = normalizeCode(evidence['code'], RECOVERY_CODE_SYMBOLS);
        const match =
          n !== null &&
          db.prepare('SELECT 1 FROM recovery_codes WHERE id = ? AND code_hash = ? AND invalidated_at IS NULL').get(current.id, recoveryHash(n)) !== undefined;
        if (!match) throw denied();
      } else if (evidence['type'] === 'approval') {
        consumeStepUp(db, auth, evidence['requestId'], 'regenerate_code');
      } else {
        throw denied();
      }
    }

    // Mã thay thế chờ trước đó (nếu có) bị vô hiệu: tại mọi thời điểm chỉ một mã thay thế chờ.
    db.prepare("UPDATE code_replacements SET state = 'void' WHERE identity_id = ? AND state = 'pending'").run(auth.identityId);
    const replacement = generateRecoveryCode();
    const id = randomUUID();
    const expiresAt = inMs(PENDING_TTL_MS);
    db.prepare(
      `INSERT INTO code_replacements (id, identity_id, session_id, old_code_id, replacement_hash, state, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(id, auth.identityId, auth.sessionId, current?.id ?? null, recoveryHash(normalizeCode(replacement, RECOVERY_CODE_SYMBOLS)!), nowIso(), expiresAt);
    return { pendingId: id, replacementCode: replacement, expiresAt };
  });
}

/** Pha 2: chủ nhập lại mã thay thế (xác nhận); commit vô hiệu mã cũ và kích hoạt mã mới trong một bước. */
export function confirmCodeReplacement(db: DatabaseSync, auth: AuthContext, input: Record<string, unknown>): { committed: true } {
  const n = normalizeCode(input['replacementCode'], RECOVERY_CODE_SYMBOLS);
  const wrong = () => new ApiError(400, 'INVALID_REPLACEMENT', 'Mã thay thế không đúng.');
  const pendingId = input['pendingId'];
  if (n === null || typeof pendingId !== 'string') throw wrong();
  return tx(db, () => {
    const r = db
      .prepare("SELECT id, old_code_id, replacement_hash, expires_at FROM code_replacements WHERE id = ? AND identity_id = ? AND state = 'pending'")
      .get(pendingId, auth.identityId) as { id: string; old_code_id: string | null; replacement_hash: string; expires_at: string } | undefined;
    if (!r) throw notFound('Không có mã thay thế đang chờ.');
    if (r.expires_at <= nowIso()) {
      db.prepare("UPDATE code_replacements SET state = 'void' WHERE id = ?").run(r.id);
      throw new ApiError(400, 'ATTEMPT_EXPIRED', 'Mã thay thế đã hết hạn. Hãy tạo lại; mã hiện tại vẫn dùng được.');
    }
    if (r.replacement_hash !== recoveryHash(n)) throw wrong();
    const current = activeCode(db, auth.identityId);
    if ((current?.id ?? null) !== r.old_code_id) {
      db.prepare("UPDATE code_replacements SET state = 'void' WHERE id = ?").run(r.id);
      throw conflict('CODE_CHANGED', 'Mã khôi phục đã thay đổi trong lúc chờ. Hãy bắt đầu lại.');
    }
    const t = nowIso();
    if (current) {
      db.prepare("UPDATE recovery_codes SET invalidated_at = ?, invalidated_reason = 'replaced' WHERE id = ?").run(t, current.id);
    }
    db.prepare('INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) VALUES (?, ?, ?, ?)').run(
      randomUUID(),
      auth.identityId,
      r.replacement_hash,
      t,
    );
    db.prepare("UPDATE code_replacements SET state = 'committed' WHERE id = ?").run(r.id);
    return { committed: true as const };
  });
}
