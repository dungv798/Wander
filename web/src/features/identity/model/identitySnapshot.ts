import type { Device, EventKind, IdentityEvent, IdentitySnapshot } from './identity.types.ts';

const EVENT_KINDS: readonly EventKind[] = ['created', 'code', 'paired', 'revoked', 'recovered'];

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Thời điểm ISO thành mili giây; không đọc được thì 0 (hiển thị "lâu rồi" thay vì làm sập màn). */
function toMillis(iso: unknown): number {
  const t = typeof iso === 'string' ? Date.parse(iso) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** Thiết bị từ một phiên của API; thiếu mã thì bỏ (trả null). Chưa đặt tên thì dùng `fallbackName`. */
function toDevice(raw: unknown, fallbackName: string): Device | null {
  if (!isRecord(raw) || typeof raw['id'] !== 'string') return null;
  const name = typeof raw['deviceName'] === 'string' && raw['deviceName'] ? raw['deviceName'] : fallbackName;
  return { id: raw['id'], name, at: toMillis(raw['lastSeenAt']), current: raw['current'] === true };
}

/** Sự kiện từ API; loại lạ hoặc sai hình dạng thì bỏ (backend có thể thêm loại mới mà bản cũ chưa biết). */
function toEvent(raw: unknown): IdentityEvent | null {
  if (!isRecord(raw)) return null;
  const kind = EVENT_KINDS.find((k) => k === raw['kind']);
  if (!kind) return null;
  const device = typeof raw['deviceName'] === 'string' && raw['deviceName'] ? raw['deviceName'] : undefined;
  return { at: toMillis(raw['at']), kind, ...(device ? { device } : {}) };
}

/**
 * Ghép ba phản hồi (`/api/sessions`, `/api/events`, `/api/recovery-code`) thành ảnh chụp danh tính. Dữ liệu từ mạng là không tin cậy
 * nên phần tử hỏng bị bỏ, không làm sập màn Bảo mật; thiếu hẳn danh sách thiết bị thì trả null (coi là phản hồi hỏng).
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

/** Nhánh màn hết phiên: A = còn đường khôi phục (có mã hoặc còn thiết bị khác), B = không còn gì để khôi phục (D20, D26). */
export function expiredBranch(known: { readonly hasCode: boolean; readonly deviceCount: number } | null): 'A' | 'B' {
  return known !== null && (known.hasCode || known.deviceCount > 1) ? 'A' : 'B';
}
