import { MAP } from './map.const.ts';
import type { FitOptions, Insets } from './map.types.ts';

/** Chỉ vừa lại khi inset thực sự đổi và camera chưa do người dùng chỉnh hoặc ghim đã bị che. */
export function needsInsetRefit(before: Insets, after: Insets, touched: boolean, visible: boolean): boolean {
  const changed = before.top !== after.top || before.right !== after.right || before.bottom !== after.bottom || before.left !== after.left;
  return changed && (!touched || !visible);
}

/** Giữ trần zoom vừa khung thường, cho phép cụm dùng trần riêng trong giới hạn MapLibre. */
export function fitMaxZoom(options: FitOptions): number {
  return Math.max(MAP.GL_MIN_ZOOM, Math.min(MAP.GL_MAX_ZOOM, options.maxZoom ?? MAP.GL_FIT_MAX_ZOOM));
}

/** Nhận lỗi nguồn/ô nền; dữ liệu tuyến và ghim của ứng dụng không phải nguồn nền. */
export function isBasemapError(event: { error?: unknown; sourceId?: string; source?: unknown; tile?: unknown }): boolean {
  return event.sourceId !== MAP.ROUTE_SOURCE_ID && !MAP.PIN_SOURCES.some((source) => source === event.sourceId) && Boolean(event.sourceId || event.source || event.tile);
}
