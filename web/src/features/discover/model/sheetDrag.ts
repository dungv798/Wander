import { SHEET_DRAG } from './shellMap.const.ts';

/** Trạng thái tờ nội dung ở điện thoại: mở (che phần lớn bản đồ) hoặc thu lại (chỉ còn dải tiêu đề). */
export type SheetDragMode = 'open' | 'peek';

/** Độ dịch hiển thị khi đang kéo: chỉ theo chiều dẫn tới trạng thái kia (mở → kéo xuống; thu → kéo lên), không quá `travel` px. */
export function clampDragOffset(mode: SheetDragMode, dy: number, travel: number): number {
  return mode === 'open' ? Math.min(travel, Math.max(0, dy)) : Math.max(-travel, Math.min(0, dy));
}

/** Một lần chạm có dịch chuyển nhỏ hơn ngưỡng thì là bấm, không phải kéo. */
export function isTap(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) <= SHEET_DRAG.TAP_SLOP_PX;
}

/**
 * Trạng thái sau khi thả: chuyển sang trạng thái kia nếu kéo đủ xa (`COMMIT_FRACTION` của `travel`) hoặc hất đủ nhanh; ngược lại giữ nguyên.
 * `dy` là độ dịch dọc (dương = xuống), `elapsedMs` là thời gian kéo, `travel` là quãng đường giữa hai trạng thái (px).
 */
export function decideSheetMode(mode: SheetDragMode, dy: number, elapsedMs: number, travel: number): SheetDragMode {
  const towardOther = mode === 'open' ? dy : -dy;
  if (towardOther <= 0) return mode;
  const velocity = towardOther / Math.max(1, elapsedMs);
  const committed = towardOther >= travel * SHEET_DRAG.COMMIT_FRACTION || velocity >= SHEET_DRAG.FLING_PX_PER_MS;
  if (!committed) return mode;
  return mode === 'open' ? 'peek' : 'open';
}
