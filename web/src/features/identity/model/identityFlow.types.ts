import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import type { PairingRequest } from './identity.types.ts';

/** Mục đích của luồng hiện mã khôi phục mới. */
export type IssuePurpose = 'first' | 'regen' | 'recover';

/** Mô tả một luồng phát hành mã khôi phục mới (hiện mã → nhập lại 2 nhóm → xem lại một lần cuối). */
export interface IssueSpec {
  readonly purpose: IssuePurpose;
  /** Gọi NGAY khi người dùng nhập lại đúng: mã mới có hiệu lực ở đúng lúc này (QĐ-6, một lần commit). */
  readonly onCommit: (code: RecoveryCode) => void;
  /** Gọi khi người dùng bấm Xong ở bước cuối. */
  readonly onDone: () => void;
  /** Chỉ luồng lần đầu: "Để sau" (lưu chuyến đi mà chưa có mã). */
  readonly onSkip?: () => void;
  /** Hết hạn lần thử (khôi phục): quá giờ này mà xác nhận thì phải bắt đầu lại. */
  readonly expiresAt?: number;
  readonly onExpired?: () => void;
}

/** Các luồng tờ phủ của danh tính (một lúc một luồng). */
export type Flow =
  | { readonly kind: 'intro'; readonly onSaved: () => void; /** Máy chủ còn danh tính cũ nhưng không còn đường khôi phục (nhánh B): tạo mới sẽ làm mất chuyến cũ vĩnh viễn. */ readonly replacing?: boolean }
  | { readonly kind: 'issue'; readonly issue: IssueSpec }
  | { readonly kind: 'reauth'; readonly title: string; readonly why: string; readonly onOk: () => void }
  | { readonly kind: 'revoke'; readonly deviceId: string }
  | { readonly kind: 'pairConfirm'; readonly pairing: PairingRequest };
