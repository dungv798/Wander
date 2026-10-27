/** Khóa lưu trữ phía trình duyệt. Chỉ dữ liệu không bí mật (RG-6: không thêm nơi lưu bí mật khác). */
export const STORAGE = {
  DISCOVER: 'wander.web.discover.v1',
  /** Bí mật phiên (Bearer) của máy này; giữ ở localStorage theo AD-1 tới khi xét lại ở RG-6. */
  TOKEN: 'wander.web.token.v1',
  /** Cờ của máy này (vừa khôi phục) và mốc đã biết để chọn nhánh màn hết phiên; KHÔNG chứa bí mật. */
  SESSION: 'wander.web.session.v2',
  /** Đếm lần nhập sai mã của máy này (bền qua tải lại). */
  LOCKS: 'wander.web.locks.v1',
  /** Đã xem giới thiệu lần đầu (chỉ hiện một lần). */
  ONBOARDING: 'wander.web.onboarding.v1',
} as const;

/** Điểm ngắt giao diện (px), khớp CSS của prototype (docs/ux/screens.md "Khung thích ứng"). */
export const BREAKPOINT = {
  WIDE: 768,
  DRAWER: 1280,
} as const;

/** Truy vấn media dùng chung. */
export const MEDIA = {
  WIDE: `(min-width: ${BREAKPOINT.WIDE}px)`,
  DRAWER: `(min-width: ${BREAKPOINT.DRAWER}px)`,
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
} as const;

/** Kích thước và thời lượng giao diện. */
export const UI = {
  TAP_TARGET_PX: 44,
  /** Thời gian lớp `enter` (hiện dần khi đổi màn) tồn tại, ms. */
  ENTER_MS: 1100,
  /** Thời gian chờ giữa lần gõ tìm kiếm và lần lọc, ms. */
  SEARCH_DEBOUNCE_MS: 120,
  MONTHS_IN_YEAR: 12,
  /** Số nơi "Nên đi tháng này" tối đa. */
  MONTH_LIMIT: 5,
  /** Độ trễ cộng dồn giữa các thẻ hiện dần, ms. */
  STAGGER_MS: 70,
  STAGGER_WALL_MS: 60,
  TOAST_MS: 2600,
  TOAST_UNDO_MS: 10_000,
} as const;

/** Ngưỡng cử chỉ quẹt thẻ (khớp prototype). */
export const SWIPE = {
  DISTANCE_PX: 110,
  FAST_VELOCITY: 0.6,
  FAST_MIN_DISTANCE_PX: 40,
  TAP_MOVE_PX: 8,
  STAMP_FULL_PX: 90,
  PROGRESS_FULL_PX: 130,
  ROTATE_DIVISOR: 18,
  DRAG_Y_FACTOR: 0.3,
  FLING_PX: 560,
  FLING_UP_PX: -30,
  FLING_ROTATE_DEG: 28,
  FLING_MS: 320,
  FLING_DONE_MS: 300,
  RETURN_MS: 280,
  /** Vùng chạm cạnh trái/phải của thẻ để đổi ảnh (tỉ lệ chiều rộng). */
  EDGE_LEFT: 0.3,
  EDGE_RIGHT: 0.7,
  /** Số thẻ dựng cùng lúc trong bộ bài. */
  VISIBLE_CARDS: 3,
  /** Số thẻ kế sau các thẻ đang hiện mà ảnh được tải trước. */
  PRELOAD_CARDS: 3,
} as const;
