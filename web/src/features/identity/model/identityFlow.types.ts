import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import type { ApprovalPreview, Evidence } from '../api/IdentityGateway.ts';

/** Mục đích của luồng hiện mã khôi phục mới. */
export type IssuePurpose = 'first' | 'regen' | 'recover';

/** Một mã khôi phục mới do MÁY CHỦ sinh và cách chốt nó (mã chỉ có hiệu lực khi `commit` thành công, QĐ-6). */
export interface IssueSession {
  readonly code: RecoveryCode;
  /** Chốt mã ngay khi người dùng nhập lại đúng; ném `ApiError` nếu máy chủ từ chối (hết hạn, mã đã đổi…). */
  readonly commit: () => Promise<void>;
}

/** Mô tả một luồng phát hành mã khôi phục mới (lấy mã từ máy chủ → hiện mã → nhập lại 2 nhóm → xem lại một lần cuối). */
export interface IssueSpec {
  readonly purpose: IssuePurpose;
  /** Xin mã mới từ máy chủ (gọi đúng MỘT lần khi mở tờ); ném `ApiError` nếu không xin được. */
  readonly open: () => Promise<IssueSession>;
  /** Gọi khi người dùng bấm Xong ở bước cuối. */
  readonly onDone: () => void;
  /** Chỉ luồng lần đầu: "Để sau" (lưu chuyến đi mà chưa có mã). */
  readonly onSkip?: () => void;
  /** Mở tờ không được (lỗi mạng, bị từ chối): báo cho người dùng rồi đóng. */
  readonly onOpenFailed?: (error: unknown) => void;
  /** Máy chủ báo lần thử đã hết hạn khi xác nhận: thay cho thông báo lỗi chung (ví dụ khôi phục dẫn người dùng về bước nhập mã). */
  readonly onExpired?: () => void;
}

/** Kết quả một lần xác thực lại: đã xong (luồng tiếp theo đã mở), hay bằng chứng chưa đủ (sai mã, chưa được duyệt). */
export type ReauthAttempt = (evidence: Evidence) => Promise<boolean>;

/** Các luồng tờ phủ của danh tính (một lúc một luồng). */
export type Flow =
  | { readonly kind: 'intro'; readonly onSaved: () => unknown; /** Có danh tính cũ không còn đường khôi phục (nhánh B): tạo mới sẽ làm mất chuyến cũ. */ readonly replacing?: boolean }
  | { readonly kind: 'issue'; readonly issue: IssueSpec }
  | { readonly kind: 'reauth'; readonly title: string; readonly why: string; readonly attempt: ReauthAttempt }
  | { readonly kind: 'revoke'; readonly deviceId: string }
  | { readonly kind: 'pairConfirm'; readonly preview: ApprovalPreview };
