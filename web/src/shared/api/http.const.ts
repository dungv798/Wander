/** Mã HTTP và tên tiêu đề dùng ở lớp gọi API (một nơi, không rải số/chuỗi ra mã). */
export const HTTP = {
  NO_CONTENT: 204,
  NOT_FOUND: 404,
} as const;

/** Tên tiêu đề và kiểu nội dung JSON. */
export const HEADER = {
  ACCEPT: 'Accept',
  CONTENT_TYPE: 'Content-Type',
  JSON: 'application/json',
} as const;

/** Mã lỗi mà lớp gọi API tự đặt khi máy chủ không trả mã (khớp `docs/ux/error-codes.md`). */
export const CLIENT_ERROR = {
  NETWORK: 'NETWORK',
  INTERNAL: 'INTERNAL',
} as const;

/** Tên lỗi của `fetch` khi bị hủy bằng `AbortSignal`: không phải lỗi mạng, người gọi tự xử lý. */
export const ABORT_ERROR_NAME = 'AbortError';
