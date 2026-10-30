import { MAP } from './map.const.ts';
import { airKm } from '../lib/geo.ts';
import { HALF } from '../const/math.const.ts';
import type { FitOptions, Insets, Pt, Size } from './map.types.ts';

/** Chỉ vừa lại khi inset thực sự đổi và camera chưa do người dùng chỉnh hoặc ghim đã bị che. */
export function needsInsetRefit(before: Insets, after: Insets, touched: boolean, visible: boolean): boolean {
  const changed = before.top !== after.top || before.right !== after.right || before.bottom !== after.bottom || before.left !== after.left;
  return changed && (!touched || !visible);
}

/** Cặp điểm càng gần càng được phóng lớn; fitBounds vẫn giữ đủ hai điểm, cụm giữ trần riêng. */
export function fitMaxZoom(options: FitOptions, points: readonly Pt[] = []): number {
  const [a, b] = points;
  let limit: number = points.length > MAP.FIT_SMALL_COUNT ? MAP.FIT_REGION_ZOOM : MAP.GL_FIT_MAX_ZOOM;
  if (a && b && points.length === MAP.FIT_SMALL_COUNT) {
    const distance = airKm({ lon: a[0], lat: a[1] }, { lon: b[0], lat: b[1] });
    limit = distance <= MAP.FIT_NEAR_KM ? MAP.FIT_NEAR_ZOOM : distance <= MAP.FIT_LOCAL_KM ? MAP.FIT_LOCAL_ZOOM : distance <= MAP.FIT_CITY_KM ? MAP.FIT_CITY_ZOOM : MAP.FIT_REGION_ZOOM;
  }
  return Math.max(MAP.GL_MIN_ZOOM, Math.min(MAP.GL_MAX_ZOOM, options.maxZoom ?? limit));
}

/** Lề px giữ ghim và tên khỏi mép/ghi công; khung đang co vẫn còn vùng nhìn dương. */
export function fitPadding(size: Size, inset: Insets, pad: number = MAP.FIT_PADDING, credit = false): Insets {
  /** Kẹp lề để inset lớn không làm kích thước camera âm. */
  const cap = (value: number, length: number): number => Math.max(0, Math.min(value, length / HALF - 1));
  const side = Math.max(pad, MAP.FIT_LABEL_SIDE);
  return {
    top: cap(inset.top + pad, size.h),
    bottom: cap(inset.bottom + pad + MAP.FIT_LABEL_SPACE + (credit ? MAP.CREDIT_BAND : 0), size.h),
    left: cap(inset.left + side, size.w),
    right: cap(inset.right + side, size.w),
  };
}

/** Nhận lỗi nguồn/ô nền; dữ liệu tuyến và ghim của ứng dụng không phải nguồn nền. */
export function isBasemapError(event: { error?: unknown; sourceId?: string; source?: unknown; tile?: unknown }): boolean {
  return event.sourceId !== MAP.ROUTE_SOURCE_ID && !MAP.PIN_SOURCES.some((source) => source === event.sourceId) && Boolean(event.sourceId || event.source || event.tile);
}
