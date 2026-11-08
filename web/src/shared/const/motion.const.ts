/**
 * Thời lượng chuyển động dùng chung (ms). Nguồn thật của CSS là các token `--dur-*` ở `styles/tokens.css`;
 * `motion.const.test.ts` giữ hai nơi khớp nhau. Mã TS (JS animation, hẹn giờ) đọc từ đây, không rải số.
 * Phạm vi theo PO 05/11/2026: bấm 100–160 ms, đổi bề mặt 220–280 ms, camera bản đồ 650–900 ms.
 */
export const MOTION = {
  /** Phản hồi chạm/nhấn nút. */
  PRESS_MS: 140,
  /** Mở/đổi một bề mặt (tờ, bảng, chuyển màn). */
  SURFACE_MS: 240,
  /** Camera bản đồ bay sang cảnh mới (khớp `MAP.FLY_MS`). */
  MAP_FLY_MS: 750,
} as const;

/** Khoảng cho phép của từng nhóm chuyển động (ms), để test bắt đổi số vượt khuôn khổ đã duyệt. */
export const MOTION_RANGE = {
  PRESS_MS: [100, 160],
  SURFACE_MS: [220, 280],
  MAP_FLY_MS: [650, 900],
} as const;
