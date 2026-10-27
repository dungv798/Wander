import { IDENTITY } from './identity.const.ts';
import type { Device, EventKind, IdentityEvent, PairingRequest, PairingStatus, ServerIdentity, ServerState, SessionState } from './identity.types.ts';
import { INITIAL_SERVER } from './identityServer.ts';

type Rec = Record<string, unknown>;

const EVENT_KINDS: readonly EventKind[] = ['created', 'code', 'paired', 'revoked', 'recovered'];
const PAIRING_STATUSES: readonly PairingStatus[] = ['waiting', 'approved', 'denied'];
const CODE_PATTERN = /^[0-9A-Z]{8}$/;

/** Có phải đối tượng thường. */
function isRec(v: unknown): v is Rec {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
/** Số hữu hạn hoặc 0. */
function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** Làm sạch một thiết bị; thiếu mã hoặc tên thì bỏ. */
function sanitizeDevice(raw: unknown): Device | null {
  if (!isRec(raw) || typeof raw['id'] !== 'string' || typeof raw['name'] !== 'string' || !raw['name']) return null;
  return { id: raw['id'], name: raw['name'].slice(0, IDENTITY.MAX_DEVICE_NAME), at: num(raw['at']) };
}

/** Làm sạch một sự kiện; loại lạ thì bỏ. */
function sanitizeEvent(raw: unknown): IdentityEvent | null {
  if (!isRec(raw) || !EVENT_KINDS.includes(raw['kind'] as EventKind)) return null;
  const device = typeof raw['device'] === 'string' ? raw['device'].slice(0, IDENTITY.MAX_DEVICE_NAME) : undefined;
  return { at: num(raw['at']), kind: raw['kind'] as EventKind, ...(device ? { device } : {}) };
}

/** Làm sạch yêu cầu ghép (mã phải đúng 8 ký hiệu). */
function sanitizePairing(raw: unknown): PairingRequest | null {
  if (!isRec(raw) || typeof raw['code'] !== 'string' || !CODE_PATTERN.test(raw['code']) || !PAIRING_STATUSES.includes(raw['status'] as PairingStatus)) return null;
  return { code: raw['code'], number: num(raw['number']), name: typeof raw['name'] === 'string' ? raw['name'].slice(0, IDENTITY.MAX_DEVICE_NAME) : '', at: num(raw['at']), status: raw['status'] as PairingStatus };
}

/** Làm sạch danh tính phía máy chủ; không có thiết bị hợp lệ nào thì coi như chưa có danh tính. */
function sanitizeIdentity(raw: unknown): ServerIdentity | null {
  if (!isRec(raw)) return null;
  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const devices = list(raw['devices']).map(sanitizeDevice).filter((d): d is Device => d !== null);
  if (!devices.length) return null;
  return {
    createdAt: num(raw['createdAt']), codeHash: typeof raw['codeHash'] === 'string' && raw['codeHash'] ? raw['codeHash'] : null, devices,
    events: list(raw['events']).map(sanitizeEvent).filter((e): e is IdentityEvent => e !== null).slice(0, IDENTITY.MAX_EVENTS), unseen: raw['unseen'] === true,
  };
}

/** Làm sạch trạng thái máy chủ giả đọc từ localStorage (không tin cậy). */
export function sanitizeServer(raw: unknown): ServerState | null {
  if (!isRec(raw)) return null;
  const requests = Array.isArray(raw['requests']) ? raw['requests'].filter((t): t is number => typeof t === 'number' && Number.isFinite(t)).slice(-IDENTITY.PAIR_REQUEST_LIMIT) : [];
  return { ...INITIAL_SERVER, identity: sanitizeIdentity(raw['identity']), pairing: sanitizePairing(raw['pairing']), requests };
}

/** Làm sạch phiên của thiết bị này. */
export function sanitizeSession(raw: unknown): SessionState | null {
  if (!isRec(raw)) return null;
  return { deviceId: typeof raw['deviceId'] === 'string' && raw['deviceId'] ? raw['deviceId'] : null, recovered: raw['recovered'] === true };
}
