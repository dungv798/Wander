import { IDENTITY } from './identity.const.ts';

/** Nơi đếm lần nhập sai: khôi phục trên máy mới, xác thực lại, nhập mã ghép (mỗi nơi đếm riêng). */
export type LockScope = 'recover' | 'reauth' | 'pair';

/** Số lần sai và thời điểm hết khóa (0 = chưa khóa) của một nơi. */
export interface Attempts {
  readonly tries: number;
  readonly until: number;
}

/** Trạng thái đếm lần sai của máy này. Lưu bền (tải lại, đổi chế độ, đóng/mở tờ KHÔNG xóa); khóa thật theo thiết bị là việc của backend (D23). */
export type LockState = Readonly<Partial<Record<LockScope, Attempts>>>;

/** Trạng thái ban đầu: chưa sai lần nào. */
export const NO_LOCKS: LockState = {};

/** Đang bị khóa tạm ở nơi này không. */
export function isLocked(s: LockState, scope: LockScope, now: number): boolean {
  return (s[scope]?.until ?? 0) > now;
}

/** Số lần sai còn hiệu lực (hết khóa thì tính lại từ 0). */
export function triesOf(s: LockState, scope: LockScope, now: number): number {
  const a = s[scope];
  return !a || (a.until > 0 && a.until <= now) ? 0 : a.tries;
}

/** Ghi một lần nhập sai; đủ `MAX_ATTEMPTS` lần thì khóa tạm `LOCK_MS`. Khóa cũ đã hết hạn thì đếm lại từ đầu. */
export function recordFailure(s: LockState, scope: LockScope, now: number): LockState {
  if (isLocked(s, scope, now)) return s; // đang khóa: không cộng thêm, không gia hạn
  const tries = triesOf(s, scope, now) + 1;
  return { ...s, [scope]: { tries, until: tries >= IDENTITY.MAX_ATTEMPTS ? now + IDENTITY.LOCK_MS : 0 } };
}

/** Xóa đếm sai của một nơi (sau khi nhập đúng). */
export function clearFailures(s: LockState, scope: LockScope): LockState {
  const { [scope]: _drop, ...rest } = s;
  return rest;
}

/** Làm sạch trạng thái khóa đọc từ localStorage (không tin cậy). */
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
