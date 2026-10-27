import { ApiError } from '../../../shared/api/ApiError.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import type { BegunReplacement } from '../api/IdentityGateway.ts';
import type { IssueSession, IssueSpec } from '../model/identityFlow.types.ts';
import type { IdentityActions, RecoveryAttempt } from './identityContext.ts';

/** Mã hiển thị do máy chủ trả thành `RecoveryCode`; sai dạng là phản hồi hỏng (`INTERNAL`), không để giao diện hiện mã sai. */
export function toRecoveryCode(display: string): RecoveryCode {
  const code = RecoveryCode.parse(display);
  if (!code) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return code;
}

/** Phiên hiện mã cho một mã thay thế vừa xin: chốt bằng `confirmReplacement` (pha 2). */
export function replacementSession(actions: IdentityActions, begun: BegunReplacement): IssueSession {
  return { code: toRecoveryCode(begun.code), commit: () => actions.confirmReplacement(begun.pendingId, begun.code) };
}

/** Phiên hiện mã cho lần khôi phục đang chờ: chốt bằng `completeRecovery` (mã thay thế do máy chủ sinh, hết hạn sau 15 phút). */
export function recoverySession(actions: IdentityActions, attempt: RecoveryAttempt): IssueSession {
  return { code: toRecoveryCode(attempt.code), commit: () => actions.completeRecovery(attempt) };
}

/**
 * Luồng phát mã LẦN ĐẦU (F2): tạo danh tính (nếu chưa) rồi xin mã thay thế; "Để sau" chỉ tạo danh tính chưa có mã. Danh tính tạo ở
 * bước hiện mã, nên hủy giữa chừng để lại một danh tính ẩn danh chưa có mã (không có chuyến đi nào bị tạo).
 */
export function firstIssueSpec(actions: IdentityActions, handlers: Pick<IssueSpec, 'onDone' | 'onSkip'>): IssueSpec {
  return {
    purpose: 'first',
    open: async () => {
      await actions.ensureIdentity();
      return replacementSession(actions, await actions.beginReplacement());
    },
    ...handlers,
  };
}
