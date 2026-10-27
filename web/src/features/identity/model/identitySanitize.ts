import type { KnownIdentity, SessionState } from './identity.types.ts';

/** Phiên mặc định: chưa khôi phục và chưa biết gì về danh tính. */
export const NO_SESSION: SessionState = { recovered: false, known: null };

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Mốc đã biết: cần `hasCode` boolean và `deviceCount` là số nguyên không âm; sai thì coi như chưa biết. */
function sanitizeKnown(raw: unknown): KnownIdentity | null {
  if (!isRecord(raw) || typeof raw['hasCode'] !== 'boolean') return null;
  const count = raw['deviceCount'];
  return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? { hasCode: raw['hasCode'], deviceCount: count } : null;
}

/** Làm sạch cờ phiên của máy này đọc từ localStorage (không tin cậy). Không chứa bí mật. */
export function sanitizeSession(raw: unknown): SessionState | null {
  if (!isRecord(raw)) return null;
  return { recovered: raw['recovered'] === true, known: sanitizeKnown(raw['known']) };
}
