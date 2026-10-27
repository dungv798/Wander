/** Các nấc của tờ kéo. */
export type Snap = 'peek' | 'half' | 'full';

/** Thứ tự nấc từ thấp lên cao. */
export const SNAP_ORDER: readonly Snap[] = ['peek', 'half', 'full'];

/** Hằng số của tờ kéo (px trừ khi ghi khác). Chuyển từ docs/ux/prototype/app/sheet.js. */
export const SHEET = {
  /** Chiều cao nhìn thấy ở nấc thu gọn (đủ thấy tay nắm + tiêu đề + tab). */
  PEEK_VISIBLE: 168,
  HALF_RATIO: 0.5,
  /** Nấc đầy cách mép trên khung (chừa nút nổi trên bản đồ). */
  FULL_TOP: 72,
  /** Vận tốc (px/ms) đủ để nhảy sang nấc kế theo hướng vuốt. */
  VELOCITY_SNAP: 0.45,
  TAP_MAX_MOVE: 6,
  OVERDRAG_DOWN: 40,
  OVERDRAG_UP: 12,
} as const;
