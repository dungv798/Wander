import type { Device, EventKind, IdentityEvent, IdentitySnapshot } from './identity.types.ts';

const EVENT_KINDS: readonly EventKind[] = ['created', 'code', 'paired', 'revoked', 'recovered'];

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** An ISO instant to milliseconds; unreadable gives 0 (shown as 'long ago' instead of crashing the screen). */
function toMillis(iso: unknown): number {
  const t = typeof iso === 'string' ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** A device from an API session; a missing id drops it (returns null). Without a name `fallbackName` is used. */
function toDevice(raw: unknown, fallbackName: string): Device | null {
  if (!isRecord(raw) || typeof raw['id'] !== 'string') return null;
  const name = typeof raw['deviceName'] === 'string' && raw['deviceName'] ? raw['deviceName'] : fallbackName;
  return { id: raw['id'], name, at: toMillis(raw['lastSeenAt']), current: raw['current'] === true };
}

/** An event from the API; an unknown kind or a wrong shape is dropped (the backend may add new kinds that an old version does not know). */
function toEvent(raw: unknown): IdentityEvent | null {
  if (!isRecord(raw)) return null;
  const kind = EVENT_KINDS.find((k) => k === raw['kind']);
  if (!kind) return null;
  const device = typeof raw['deviceName'] === 'string' && raw['deviceName'] ? raw['deviceName'] : undefined;
  return { at: toMillis(raw['at']), kind, ...(device ? { device } : {}) };
}

/**
 * Combines three responses (`/api/sessions`, `/api/events`, `/api/recovery-code`) into an identity snapshot. Data from the network is untrusted
 * so a broken element is dropped and does not crash the Security screen; a missing device list gives null (treated as a broken response).
 */
export function toSnapshot(sessions: unknown, events: unknown, code: unknown, fallbackName: string): IdentitySnapshot | null {
  const sessionList = isRecord(sessions) ? sessions['sessions'] : undefined;
  if (!Array.isArray(sessionList)) return null;
  const eventList = isRecord(events) && Array.isArray(events['events']) ? events['events'] : [];
  return {
    devices: sessionList.map((s) => toDevice(s, fallbackName)).filter((d): d is Device => d !== null),
    events: eventList.map(toEvent).filter((e): e is IdentityEvent => e !== null),
    unseen: isRecord(events) && events['unseen'] === true,
    hasCode: isRecord(code) && code['hasCode'] === true,
  };
}

/** The session-ended screen branch: A = there is still a way to recover (a code or another device), B = nothing left to recover (D20, D26). */
export function expiredBranch(known: { readonly hasCode: boolean; readonly deviceCount: number } | null): 'A' | 'B' {
  return known !== null && (known.hasCode || known.deviceCount > 1) ? 'A' : 'B';
}
