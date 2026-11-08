import { createContext, useContext } from 'react';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { isLocked, triesOf } from '../model/attemptLock.ts';
import type { LockScope, LockState } from '../model/attemptLock.ts';
import type { AnswerOutcome, ApprovalPreview, BegunReplacement, Evidence, RecoveryStarted, StepUpRequested } from '../api/IdentityGateway.ts';
import type { IdentitySnapshot, IdentityStatus, PairingRequest, PairingStatus, SessionState } from '../model/identity.types.ts';
import type { Flow } from '../model/identityFlow.types.ts';

/** Lần khôi phục đã bắt đầu trên máy này: mã thay thế do máy chủ sinh và bí mật phiên máy này tự sinh (chưa có hiệu lực). */
export interface RecoveryAttempt extends RecoveryStarted {
  readonly sessionToken: string;
}

/**
 * Các thao tác trên danh tính, mọi thao tác gọi API thật và ném `ApiError` có mã khi thất bại (người gọi báo lỗi cho người dùng).
 * Thao tác thành công tự nạp lại ảnh chụp danh tính để giao diện luôn phản ánh máy chủ.
 */
export interface IdentityActions {
  /** Bảo đảm máy này có danh tính (tạo nếu chưa); chưa có mã khôi phục. */
  readonly ensureIdentity: () => Promise<void>;
  /** Phát hành mã thay thế do máy chủ sinh (pha 1); đã có mã hiện hành thì cần bằng chứng. */
  readonly beginReplacement: (evidence?: Evidence) => Promise<BegunReplacement>;
  /** Xác nhận mã thay thế (pha 2): mã mới có hiệu lực, mã cũ hết hiệu lực. */
  readonly confirmReplacement: (pendingId: string, code: string) => Promise<void>;
  /** Xin phê duyệt xác thực lại từ thiết bị khác. */
  readonly requestStepUp: () => Promise<StepUpRequested>;
  readonly revoke: (deviceId: string) => Promise<void>;
  /** Chủ đã mở màn Bảo mật: tắt cờ "chưa xem". */
  readonly markSeen: () => Promise<void>;
  /** Đổi tên thiết bị này (tên đã kiểm bằng `parseDeviceName`). */
  readonly renameHere: (name: string) => Promise<void>;
  /** Bắt đầu khôi phục bằng mã trên máy này (máy chưa có phiên); sai mã ném `INVALID_CODE`. */
  readonly startRecovery: (code: string) => Promise<RecoveryAttempt>;
  /** Hoàn tất khôi phục: phiên của máy này bắt đầu có hiệu lực. */
  readonly completeRecovery: (attempt: RecoveryAttempt) => Promise<void>;
  /** Máy này xin ghép (máy mới); null nếu quá hạn mức yêu cầu. */
  readonly requestPairing: () => Promise<PairingRequest | null>;
  /** Trạng thái yêu cầu ghép của máy này. */
  readonly pairingStatus: (request: PairingRequest, signal?: AbortSignal) => Promise<PairingStatus>;
  /** Yêu cầu ghép đã được duyệt: máy này trở thành thiết bị tin cậy. */
  readonly joinHere: (request: PairingRequest) => Promise<void>;
  /** Thiết bị duyệt nhập mã và xem trước yêu cầu (ghép hoặc xác thực lại). */
  readonly preview: (code: string) => Promise<ApprovalPreview>;
  /** Trả lời yêu cầu bằng số khớp; chọn sai là từ chối vĩnh viễn yêu cầu đó. */
  readonly answer: (preview: ApprovalPreview, number: number) => Promise<AnswerOutcome>;
  readonly deny: (preview: ApprovalPreview) => Promise<void>;
  /** Ghi một lần nhập sai ở `scope` (đủ 5 lần thì khóa tạm); `clearFails` xóa đếm sau khi nhập đúng. */
  readonly fail: (scope: LockScope) => void;
  readonly clearFails: (scope: LockScope) => void;
  /** Tắt nhắc "vừa mở bằng khôi phục" (người dùng đã vào xem danh sách thiết bị). */
  readonly ackRecovered: () => void;
  /** Quên phiên cũ của máy này (sau màn hết phiên). */
  readonly loseSession: () => void;
  /** Nạp lại ảnh chụp danh tính từ máy chủ. */
  readonly refresh: () => Promise<void>;
}

/** Giá trị của ngữ cảnh danh tính. */
export interface IdentityValue {
  readonly status: IdentityStatus;
  /** Danh tính của MÁY NÀY; null nếu chưa có phiên, đang nạp, hết phiên hoặc không nạp được. */
  readonly identity: IdentitySnapshot | null;
  readonly session: SessionState;
  readonly locks: LockState;
  readonly actions: IdentityActions;
  /** Mở một luồng (tờ phủ) danh tính. */
  readonly startFlow: (flow: Flow) => void;
  readonly closeFlow: () => void;
  /** Có danh tính thì chạy `then` ngay; chưa thì mở tờ giải thích lưu lần đầu (F2) và chạy `then` khi người dùng đi tiếp (`then` có thể trả Promise). */
  readonly requireIdentity: (then: () => unknown) => void;
}

export const IdentityContext = createContext<IdentityValue | null>(null);

/** Truy cập danh tính; ném lỗi nếu quên bọc `IdentityProvider`. */
export function useIdentity(): IdentityValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error('useIdentity phải nằm trong IdentityProvider');
  return ctx;
}

/** Cổng "cần danh tính": chạy hành động ngay nếu đã có danh tính, ngược lại mở tờ lưu lần đầu rồi chạy khi người dùng đi tiếp (F2). */
export function useRequireIdentity(): (then: () => unknown) => void {
  return useIdentity().requireIdentity;
}

/** Đếm lần nhập sai bền của một nơi: `locked` (đang khóa tạm, tự mở theo giờ), `failed` (đã sai ít nhất một lần), `fail()`, `reset()`. */
export function useAttemptLock(scope: LockScope): { readonly locked: boolean; readonly failed: boolean; readonly fail: () => void; readonly reset: () => void } {
  const { locks, actions } = useIdentity();
  const now = useNow(IDENTITY.POLL_MS);
  return { locked: isLocked(locks, scope, now), failed: triesOf(locks, scope, now) > 0, fail: () => actions.fail(scope), reset: () => actions.clearFails(scope) };
}

/** Máy này từng có phiên nhưng máy chủ không còn nhận (bị thu hồi từ nơi khác): phiên đã hết. */
export function useSessionExpired(): boolean {
  return useIdentity().status === 'expired';
}
