/** Mô hình danh tính ẩn danh ở FE, dựng từ API thật (`/api/sessions`, `/api/events`, `/api/recovery-code`). Máy chủ là nguồn sự thật. */

/** Một thiết bị tin cậy (một phiên chưa bị thu hồi); `at` là lần hoạt động cuối (mili giây). `name` là nhãn do thiết bị tự khai, CHƯA xác minh. */
export interface Device {
  readonly id: string;
  readonly name: string;
  readonly at: number;
  /** Đây là MÁY NÀY (phiên đang gọi). */
  readonly current: boolean;
}

/** Loại sự kiện trong "Hoạt động gần đây" (khớp `EventKind` của backend). */
export type EventKind = 'created' | 'code' | 'paired' | 'revoked' | 'recovered';

/** Một dòng "Hoạt động gần đây"; chữ hiển thị suy ra từ `kind` ở lớp giao diện (không lưu câu chữ trong dữ liệu). */
export interface IdentityEvent {
  readonly at: number;
  readonly kind: EventKind;
  /** Tên thiết bị liên quan (tự khai, chưa xác minh), nếu có. */
  readonly device?: string;
}

/** Ảnh chụp danh tính của máy này lấy từ máy chủ: thiết bị, hoạt động, cờ "chưa xem" và đã có mã khôi phục chưa. */
export interface IdentitySnapshot {
  readonly devices: readonly Device[];
  readonly events: readonly IdentityEvent[];
  /** Có thiết bị mới được thêm (ghép/khôi phục) kể từ lần mở màn Bảo mật gần nhất. */
  readonly unseen: boolean;
  readonly hasCode: boolean;
}

/** Điều đã biết lần cuối về danh tính, để chọn nhánh màn hết phiên khi không còn gọi được máy chủ (không chứa bí mật). */
export interface KnownIdentity {
  readonly hasCode: boolean;
  readonly deviceCount: number;
}

/** Cờ riêng của máy này (không bí mật): vừa mở bằng khôi phục, và mốc đã biết gần nhất. */
export interface SessionState {
  /** Vừa mở chuyến đi trên máy này bằng khôi phục (hiện nhắc kiểm tra danh sách thiết bị). */
  readonly recovered: boolean;
  readonly known: KnownIdentity | null;
}

/** Trạng thái danh tính của máy này. `loading`: đang nạp lần đầu khi đã có bí mật phiên; `error`: không nạp được (mạng), KHÔNG coi là chưa có danh tính. */
export type IdentityStatus = 'loading' | 'anonymous' | 'ready' | 'expired' | 'error';

/** Một yêu cầu ghép do MÁY MỚI tạo (DR-018 E1): mã ghép 8 ký hiệu + số khớp 2 chữ số, hết hạn sau 5 phút. */
export interface PairingRequest {
  readonly requestId: string;
  /** Mã ghép đã chuẩn hóa (8 ký hiệu). */
  readonly code: string;
  readonly number: number;
  readonly name: string;
  readonly at: number;
  readonly expiresAt: number;
  /** Bí mật phiên máy này đã tự sinh; chỉ có hiệu lực khi thiết bị cũ duyệt đúng số. */
  readonly sessionToken: string;
}

/** Trạng thái một yêu cầu ghép theo máy chủ. */
export type PairingStatus = 'pending' | 'approved' | 'denied' | 'expired';
