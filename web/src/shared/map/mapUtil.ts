import { MEDIA } from '../const/app.const.ts';
import type { MapMarker } from './map.types.ts';

/** Hai danh sách ghim có giống nhau (cùng id, tọa độ, nhãn, số, ảnh, kiểu) không: để bỏ qua việc dựng lại khi chỉ đổi tham chiếu mảng. */
export function sameMarkers(a: readonly MapMarker[], b: readonly MapMarker[]): boolean {
  return a.length === b.length && a.every((m, i) => JSON.stringify(m) === JSON.stringify(b[i]));
}

/** Người dùng yêu cầu giảm chuyển động. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(MEDIA.REDUCED_MOTION).matches;
}
