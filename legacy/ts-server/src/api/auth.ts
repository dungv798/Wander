// Danh tính ẩn danh và phiên tối thiểu (D15). KHÔNG gồm mã khôi phục, thiết bị tin cậy, xác thực lại:
// các phần đó thuộc release gate Q16 (docs/implementation/decisions.md, RG-1) và chưa được triển khai.
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Bí mật phiên do bên giữ phiên tự sinh (>= 256 bit, base64url); server chỉ giữ băm. */
export const SESSION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function insertSession(db: DatabaseSync, identityId: string, tokenHash: string): string {
  const now = new Date().toISOString();
  const sessionId = randomUUID();
  db.prepare(
    'INSERT INTO sessions (id, identity_id, token_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)',
  ).run(sessionId, identityId, tokenHash, now, now);
  return sessionId;
}

export function createIdentityWithSession(db: DatabaseSync): { identityId: string; token: string; sessionId: string } {
  const identityId = randomUUID();
  // 256 bit ngẫu nhiên; chỉ lưu băm, không lưu token.
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO identities (id, created_at) VALUES (?, ?)').run(identityId, new Date().toISOString());
  const sessionId = insertSession(db, identityId, hashToken(token));
  return { identityId, token, sessionId };
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export function listActiveSessions(db: DatabaseSync, auth: AuthContext): SessionInfo[] {
  const rows = db
    .prepare('SELECT id, created_at, last_seen_at FROM sessions WHERE identity_id = ? AND revoked_at IS NULL ORDER BY created_at, id')
    .all(auth.identityId) as { id: string; created_at: string; last_seen_at: string }[];
  return rows.map((r) => ({ id: r.id, createdAt: r.created_at, lastSeenAt: r.last_seen_at, current: r.id === auth.sessionId }));
}

/** Thu hồi một phiên của chính danh tính này (không cần xác thực lại: không thuộc D25). */
export function revokeOwnSession(db: DatabaseSync, auth: AuthContext, sessionId: string): boolean {
  const row = db.prepare('SELECT id FROM sessions WHERE id = ? AND identity_id = ? AND revoked_at IS NULL').get(sessionId, auth.identityId);
  if (!row) return false;
  revokeSession(db, sessionId);
  return true;
}

export interface AuthContext {
  identityId: string;
  sessionId: string;
}

/** Kiểm tra phiên tại thời điểm mỗi yêu cầu: phiên đã thu hồi không còn quyền (INV-2). */
export function authenticate(db: DatabaseSync, token: string): AuthContext | null {
  const row = db
    .prepare('SELECT id, identity_id, revoked_at FROM sessions WHERE token_hash = ?')
    .get(hashToken(token)) as { id: string; identity_id: string; revoked_at: string | null } | undefined;
  if (!row || row.revoked_at !== null) return null;
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').run(new Date().toISOString(), row.id);
  return { identityId: row.identity_id, sessionId: row.id };
}

export function revokeSession(db: DatabaseSync, sessionId: string): void {
  db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(
    new Date().toISOString(),
    sessionId,
  );
}
