import { createContext, useContext } from 'react';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { isLocked, triesOf } from '../model/attemptLock.ts';
import type { LockScope, LockState } from '../model/attemptLock.ts';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import type { PairingRequest, ServerIdentity, ServerState, SessionState } from '../model/identity.types.ts';
import type { AnswerOutcome } from '../model/identityServer.ts';
import type { Flow } from '../model/identityFlow.types.ts';

/** Các thao tác trên danh tính. Mỗi thao tác là một hàm thuần ở `identityServer.ts` (máy chủ giả); FE-10 thay phần cài đặt bằng API thật, giữ hợp đồng này. */
export interface IdentityActions {
  /** Tạo danh tính ẩn danh cho máy này (chưa có mã). */
  readonly createHere: () => void;
  /** Chốt mã khôi phục mới có hiệu lực (mã cũ hết hiệu lực cùng lúc). */
  readonly commitCode: (code: RecoveryCode) => void;
  readonly revoke: (deviceId: string) => void;
  readonly markSeen: () => void;
  /** Máy này xin ghép (máy mới); null nếu quá hạn mức yêu cầu. */
  readonly requestPairing: () => PairingRequest | null;
  /** Thiết bị tin cậy duyệt hoặc từ chối yêu cầu ghép đang chờ. */
  readonly decidePairing: (status: 'approved' | 'denied') => void;
  /** Thiết bị tin cậy trả lời yêu cầu ghép bằng số khớp (null = từ chối); trả kết quả để báo người dùng. */
  readonly answerPairing: (choice: number | null) => AnswerOutcome;
  readonly clearPairing: () => void;
  /** Máy này trở thành thiết bị tin cậy (sau khôi phục bằng mã hoặc được thiết bị cũ duyệt). */
  readonly joinHere: (via: 'recovered' | 'paired') => void;
  /** Ghi một lần nhập sai ở `scope` (đủ 5 lần thì khóa tạm); `clearFails` xóa đếm sau khi nhập đúng. */
  readonly fail: (scope: LockScope) => void;
  readonly clearFails: (scope: LockScope) => void;
  /** Ghi nhận máy này vừa hoạt động; tắt nhắc "vừa mở bằng khôi phục" (người dùng đã vào xem danh sách thiết bị). */
  readonly touch: () => void;
  readonly ackRecovered: () => void;
  /** Đổi tên thiết bị này (tên đã kiểm bằng `parseDeviceName`). */
  readonly renameHere: (name: string) => void;
  /** Chỉ cho bản thử: máy này bị thu hồi từ nơi khác (hết phiên). */
  readonly expireHere: () => void;
  /** Chỉ cho bản thử: xóa phiên trên máy này (máy chủ giả còn danh tính). */
  readonly loseSession: () => void;
  /** Chỉ cho bản thử: thêm một thiết bị thứ hai. */
  readonly addDemoDevice: (name: string) => void;
}

/** Giá trị của ngữ cảnh danh tính. */
export interface IdentityValue {
  readonly server: ServerState;
  readonly session: SessionState;
  readonly locks: LockState;
  /** Danh tính của MÁY NÀY; null nếu chưa có hoặc máy này đã bị thu hồi. */
  readonly identity: ServerIdentity | null;
  readonly actions: IdentityActions;
  /** Mở một luồng (tờ phủ) danh tính. */
  readonly startFlow: (flow: Flow) => void;
  readonly closeFlow: () => void;
  /** Có danh tính thì chạy `then` ngay; chưa thì mở tờ giải thích lưu lần đầu (F2) và chạy `then` khi người dùng đi tiếp. */
  readonly requireIdentity: (then: () => void) => void;
}

export const IdentityContext = createContext<IdentityValue | null>(null);

/** Truy cập danh tính; ném lỗi nếu quên bọc `IdentityProvider`. */
export function useIdentity(): IdentityValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity phải nằm trong IdentityProvider');
  return ctx;
}

/** Cổng "cần danh tính": chạy hành động ngay nếu đã có danh tính, ngược lại mở tờ lưu lần đầu rồi chạy khi người dùng đi tiếp (F2). */
export function useRequireIdentity(): (then: () => void) => void {
  return useIdentity().requireIdentity;
}

/** Đếm lần nhập sai bền của một nơi: `locked` (đang khóa tạm, tự mở theo giờ), `failed` (đã sai ít nhất một lần), `fail()`, `reset()`. */
export function useAttemptLock(scope: LockScope): { readonly locked: boolean; readonly failed: boolean; readonly fail: () => void; readonly reset: () => void } {
  const { locks, actions } = useIdentity();
  const now = useNow(IDENTITY.POLL_MS);
  return { locked: isLocked(locks, scope, now), failed: triesOf(locks, scope, now) > 0, fail: () => actions.fail(scope), reset: () => actions.clearFails(scope) };
}

/** Máy này từng có phiên nhưng không còn trong danh sách thiết bị tin cậy (bị thu hồi từ nơi khác): phiên đã hết. */
export function useSessionExpired(): boolean {
  const { session, identity } = useIdentity();
  return session.deviceId !== null && identity === null;
}
