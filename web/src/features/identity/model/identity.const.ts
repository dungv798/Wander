/** Giới hạn và thời lượng của danh tính ẩn danh (DR-001, DR-018). Bản máy chủ thật PHẢI khớp các con số này. */
export const IDENTITY = {
  /** Số lần nhập sai tối đa ở một thiết bị trước khi bị khóa tạm (D23). */
  MAX_ATTEMPTS: 5,
  /** Khóa tạm 15 phút sau khi sai đủ số lần (bản giả; khóa thật theo thiết bị ở backend). */
  LOCK_MS: 900_000,
  /** Mã ghép hết hạn sau 5 phút. */
  PAIR_TTL_MS: 300_000,
  /** Hạn mức yêu cầu duyệt thiết bị: tối đa 3 yêu cầu trong 10 phút (DR-018 E1). */
  PAIR_REQUEST_LIMIT: 3,
  PAIR_REQUEST_WINDOW_MS: 600_000,
  /** Số lựa chọn "số khớp" hiện cho thiết bị duyệt (có một số đúng). */
  MATCH_OPTIONS: 3,
  /** Số khớp là số hai chữ số. */
  MATCH_MIN: 10,
  MATCH_MAX: 99,
  /** Số sự kiện "Hoạt động gần đây" giữ lại và hiện. */
  MAX_EVENTS: 50,
  SHOWN_EVENTS: 8,
  /** Độ dài tối đa tên thiết bị. */
  MAX_DEVICE_NAME: 40,
  /** Lần thử khôi phục hết hạn sau 15 phút (phải bắt đầu lại). */
  ATTEMPT_TTL_MS: 900_000,
  /** Nhịp kiểm tra yêu cầu ghép/hết hạn khi đang chờ, ms. */
  POLL_MS: 1000,
} as const;

/** Tên tệp mã khôi phục tải về. */
export const CODE_FILE_NAME = 'wander-ma-khoi-phuc.txt';

/** Tên thiết bị mặc định của bản thử. */
export const DEFAULT_DEVICE_NAME = 'Thiết bị này';
