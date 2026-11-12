import { IDENTITY } from './identity.const.ts';

/** Where wrong entries are counted: recovery on a new device, re-authentication, typing a pairing code (each place counts separately). */
export type LockScope = 'recover' | 'reauth' | 'pair';

/** The number of wrong entries and the time the lock ends (0 = not locked) for one place. */
export interface Attempts {
  readonly tries: number;
  readonly until: number;
}

/** The wrong-attempt count state of this device. Persistent (reloading, changing mode, closing/opening a sheet does NOT clear it); the real per-device lock is the backend's job (D23). */
export type LockState = Readonly<Partial<Record<LockScope, Attempts>>>;

/** The initial state: no wrong entry yet. */
export const NO_LOCKS: LockState = {};

/** Whether this place is temporarily locked. */
export function isLocked(s: LockState, scope: LockScope, now: number): boolean {
  return (s[scope]?.until ?? 0) > now;
}

/** The number of wrong entries still in effect (once the lock ends it counts from 0 again). */
export function triesOf(s: LockState, scope: LockScope, now: number): number {
  const a = s[scope];
  return !a || (a.until > 0 && a.until <= now) ? 0 : a.tries;
}

/** Records one wrong entry; `MAX_ATTEMPTS` of them lock temporarily for `LOCK_MS`. An old lock that has expired counts from the start again. */
export function recordFailure(s: LockState, scope: LockScope, now: number): LockState {
  if (isLocked(s, scope, now)) return s; // locked: no more is added, no extension
  const tries = triesOf(s, scope, now) + 1;
  return { ...s, [scope]: { tries, until: tries >= IDENTITY.MAX_ATTEMPTS ? now + IDENTITY.LOCK_MS : 0 } };
}

/** Clears the wrong-entry count of one place (after a correct entry). */
export function clearFailures(s: LockState, scope: LockScope): LockState {
  const { [scope]: _drop, ...rest } = s;
  return rest;
}

/** Cleans the lock state read from localStorage (untrusted). */
export function sanitizeLocks(raw: unknown): LockState | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const out: Partial<Record<LockScope, Attempts>> = {};
  for (const scope of ['recover', 'reauth', 'pair'] as const) {
    const a = (raw as Record<string, unknown>)[scope];
    if (typeof a !== 'object' || a === null) continue;
    const { tries, until } = a as Record<string, unknown>;
    if (typeof tries === 'number' && Number.isInteger(tries) && tries >= 0 && typeof until === 'number' && Number.isFinite(until) && until >= 0) out[scope] = { tries: Math.min(tries, IDENTITY.MAX_ATTEMPTS), until };
  }
  return out;
}
