import type { IdentitySnapshot, PairingStatus } from '../model/identity.types.ts';

/** Bằng chứng xác thực lại cho thao tác nhạy cảm (tạo lại mã): mã khôi phục hiện hành, hoặc phê duyệt từ thiết bị khác. */
export type Evidence = { readonly type: 'code'; readonly code: string } | { readonly type: 'approval'; readonly requestId: string };

/** Mã khôi phục mới do MÁY CHỦ sinh, chưa có hiệu lực cho tới khi xác nhận (QĐ-6). */
export interface BegunReplacement {
  readonly pendingId: string;
  /** Mã hiển thị `XXXXX-XXXXX-…` (30 ký hiệu); chỉ hiện một lần. */
  readonly code: string;
  readonly expiresAt: number;
}

/** Yêu cầu xin phê duyệt từ thiết bị khác (xác thực lại): mã ngắn để nhập ở máy kia và số khớp để máy kia chọn đúng. */
export interface StepUpRequested {
  readonly requestId: string;
  readonly approvalCode: string;
  readonly number: number;
  readonly expiresAt: number;
}

/** Lần khôi phục bằng mã đã bắt đầu: mã thay thế do máy chủ sinh, hết hạn sau 15 phút. */
export interface RecoveryStarted {
  readonly attemptId: string;
  readonly code: string;
  readonly expiresAt: number;
}

/** Yêu cầu ghép đã được máy mới tạo. */
export interface LinkCreated {
  readonly requestId: string;
  readonly pairingCode: string;
  readonly number: number;
  readonly expiresAt: number;
}

/** Điều thiết bị duyệt thấy trước khi chọn số khớp: loại yêu cầu, tên máy (tự khai, chưa xác minh), thời điểm, ba lựa chọn. */
export interface ApprovalPreview {
  readonly kind: 'link' | 'stepUp';
  readonly code: string;
  readonly deviceName: string | null;
  readonly createdAt: number;
  readonly options: readonly number[];
}

/** Kết quả trả lời bằng số khớp. */
export type AnswerOutcome = 'approved' | 'wrong';

/**
 * Cổng tới API danh tính của backend (nguyên lý D của SOLID): giao diện chỉ biết hợp đồng này. Mọi phương thức bất đồng bộ và ném
 * `ApiError` có mã (docs/ux/error-codes.md); bí mật phiên do cài đặt tự gắn vào tiêu đề.
 */
export interface IdentityGateway {
  /** Tạo danh tính cùng phiên đầu tiên; trả bí mật phiên (chưa có mã khôi phục, mã tạo ở bước sau). */
  createIdentity(deviceName: string): Promise<string>;
  /** Ảnh chụp danh tính của máy này (thiết bị, hoạt động, cờ chưa xem, đã có mã chưa). 401 nghĩa là hết phiên. */
  snapshot(): Promise<IdentitySnapshot>;
  /** Chủ đã mở màn Bảo mật: tắt cờ "chưa xem". */
  markSeen(): Promise<void>;
  /** Thu hồi một thiết bị (không cần xác thực lại). */
  revoke(deviceId: string): Promise<void>;
  /** Đổi hoặc xóa tên của chính máy này. */
  rename(name: string): Promise<void>;
  /** Phát hành mã thay thế (pha 1); đã có mã hiện hành thì cần `evidence`. */
  beginReplacement(evidence?: Evidence): Promise<BegunReplacement>;
  /** Xác nhận mã thay thế (pha 2): mã mới có hiệu lực, mã cũ hết hiệu lực. */
  confirmReplacement(pendingId: string, code: string): Promise<void>;
  /** Xin phê duyệt xác thực lại từ thiết bị khác. */
  requestStepUp(): Promise<StepUpRequested>;
  /** Bắt đầu khôi phục trên máy mới bằng mã; `sessionToken` do máy này tự sinh. */
  startRecovery(code: string, attemptId: string, sessionToken: string, deviceName: string): Promise<RecoveryStarted>;
  /** Hoàn tất khôi phục bằng mã thay thế: phiên của `sessionToken` bắt đầu có hiệu lực. */
  completeRecovery(attemptId: string, replacementCode: string): Promise<void>;
  /** Máy mới xin ghép với một thiết bị tin cậy. */
  createLink(sessionToken: string, deviceName: string): Promise<LinkCreated>;
  /** Trạng thái yêu cầu ghép (máy mới hỏi lặp lại). */
  linkStatus(requestId: string, signal?: AbortSignal): Promise<PairingStatus>;
  /** Thiết bị duyệt nhập mã (ghép hoặc xác thực lại) và xem trước; mã không đúng ném `INVALID_PAIRING_CODE`/`INVALID_APPROVAL_CODE`. */
  preview(code: string): Promise<ApprovalPreview>;
  /** Trả lời yêu cầu bằng số khớp; chọn sai là từ chối vĩnh viễn yêu cầu đó. */
  answer(preview: ApprovalPreview, number: number): Promise<AnswerOutcome>;
  /** Từ chối chủ động. */
  deny(preview: ApprovalPreview): Promise<void>;
}
