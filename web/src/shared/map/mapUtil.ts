import { MEDIA } from '../const/app.const.ts';
import { MAP } from './map.const.ts';
import type { MapMarker } from './map.types.ts';

/** Hai danh sách ghim có giống nhau (cùng id, tọa độ, nhãn, số, ảnh, kiểu) không: để bỏ qua việc dựng lại khi chỉ đổi tham chiếu mảng. */
export function sameMarkers(a: readonly MapMarker[], b: readonly MapMarker[]): boolean {
  return a.length === b.length && a.every((m, i) => JSON.stringify(m) === JSON.stringify(b[i]));
}

/** Người dùng yêu cầu giảm chuyển động. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(MEDIA.REDUCED_MOTION).matches;
}

/** Liên kết bản đồ ngoài (OpenStreetMap) tới ghim đầu tiên; chưa có ghim thì cho thấy cả nước. Dùng khi bản đồ trong ứng dụng không mở được. */
export function externalMapHref(markers: readonly Pick<MapMarker, 'lat' | 'lon'>[]): string {
  const first = markers[0];
  if (!first) return `https://www.openstreetmap.org/#map=${MAP.EXTERNAL_COUNTRY}`;
  return `https://www.openstreetmap.org/?mlat=${first.lat}&mlon=${first.lon}#map=${MAP.EXTERNAL_ZOOM}/${first.lat}/${first.lon}`;
}

/** Trình duyệt có tạo được ngữ cảnh WebGL không (MapLibre cần). */
export function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

let colorCtx: CanvasRenderingContext2D | null = null;
const BYTE_MAX = 255;

/** Đọc một màu CSS bất kỳ (kể cả `var()` đã giải) thành [r, g, b] trong 0..1 bằng canvas 1×1. */
export function cssColorToRgb(css: string): [number, number, number] {
  colorCtx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!colorCtx) return [0, 0, 0];
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = css;
  colorCtx.fillRect(0, 0, 1, 1);
  const d = colorCtx.getImageData(0, 0, 1, 1).data;
  return [(d[0] ?? 0) / BYTE_MAX, (d[1] ?? 0) / BYTE_MAX, (d[2] ?? 0) / BYTE_MAX];
}
