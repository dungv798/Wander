/** Lỗi gọi API/kho dữ liệu, mang mã máy chủ (docs/ux/error-codes.md) để giao diện chọn lời nhắc tiếng Việt. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  /** Tạo lỗi với mã (ví dụ `NOT_FOUND`, `NETWORK`) và mã HTTP nếu có. */
  constructor(code: string, status: number | null = null) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  /** Lỗi do mất kết nối hoặc kho không tải được (khác với lỗi nghiệp vụ). */
  get isNetwork(): boolean {
    return this.code === 'NETWORK';
  }
}
