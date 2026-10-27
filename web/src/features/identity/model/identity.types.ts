/** Mô hình danh tính ẩn danh ở FE. `ServerState` là PHẦN "MÁY CHỦ GIẢ" của pha FE (lưu cục bộ); FE-10 thay bằng API thật, giữ hình dạng này. */

/** Một thiết bị tin cậy; `at` là lần hoạt động cuối (mili giây). */
export interface Device {
  readonly id: string;
  readonly name: string;
  readonly at: number;
}

/** Loại sự kiện trong "Hoạt động gần đây". */
export type EventKind = 'created' | 'code' | 'paired' | 'revoked' | 'recovered';

/** Một dòng "Hoạt động gần đây"; chữ hiển thị suy ra từ `kind` ở lớp giao diện (không lưu câu chữ trong dữ liệu). */
export interface IdentityEvent {
  readonly at: number;
  readonly kind: EventKind;
  /** Tên thiết bị liên quan, nếu có. */
  readonly device?: string;
}

export type PairingStatus = 'waiting' | 'approved' | 'denied';

/** Một yêu cầu ghép từ máy mới: mã 8 ký hiệu + số khớp 2 chữ số (DR-018 E1). Mã ghép dùng một lần, hết hạn sau 5 phút. */
export interface PairingRequest {
  /** Mã ghép đã chuẩn hóa (8 ký hiệu). */
  readonly code: string;
  readonly number: number;
  readonly name: string;
  readonly at: number;
  readonly status: PairingStatus;
}

/** Danh tính phía máy chủ: chỉ giữ BĂM của mã khôi phục (máy chủ thật không bao giờ giữ mã đọc được). */
export interface ServerIdentity {
  readonly createdAt: number;
  readonly codeHash: string | null;
  readonly devices: readonly Device[];
  readonly events: readonly IdentityEvent[];
  /** Có hoạt động mới chưa xem (hiện thông báo ở Bảo mật). */
  readonly unseen: boolean;
}

/** Trạng thái máy chủ giả. */
export interface ServerState {
  readonly identity: ServerIdentity | null;
  /** Yêu cầu ghép đang chờ (một lúc một yêu cầu). */
  readonly pairing: PairingRequest | null;
  /** Thời điểm các yêu cầu duyệt gần đây (tính hạn mức). */
  readonly requests: readonly number[];
}

/** Phiên của thiết bị này: biết thiết bị nào là "máy này" trong danh sách của máy chủ. */
export interface SessionState {
  readonly deviceId: string | null;
  /** Vừa mở chuyến đi trên máy này bằng khôi phục (hiện nhắc kiểm tra danh sách thiết bị). */
  readonly recovered: boolean;
}
