import type { KnownIdentity, SessionState } from './identity.types.ts';

/** The default session: not recovered and nothing known about the identity. */
export const NO_SESSION: SessionState = { recovered: false, known: null };

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** The known mark: needs a boolean `hasCode` and a non-negative integer `deviceCount`; wrong means unknown. */
function sanitizeKnown(raw: unknown): KnownIdentity | null {
  if (!isRecord(raw) || typeof raw['hasCode'] !== 'boolean') return null;
  const count = raw['deviceCount'];
  return typeof count === 'number' && Number.isInteger(count) && count >= 0 ? { hasCode: raw['hasCode'], deviceCount: count } : null;
}

/** Cleans this device's session flags read from localStorage (untrusted). Contains no secret. */
export function sanitizeSession(raw: unknown): SessionState | null {
  if (!isRecord(raw)) return null;
  return { recovered: raw['recovered'] === true, known: sanitizeKnown(raw['known']) };
}
