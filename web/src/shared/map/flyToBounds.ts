import type { LngLatBounds, Map as MlMap, PaddingOptions } from 'maplibre-gl';
import { MAP } from './map.const.ts';

/**
 * Đưa camera vào khung vừa các điểm. Khi vùng nhìn thấy nhỏ hơn cả khung ở mức zoom xa nhất cho phép, `fitBounds` tính tâm theo mức
 * zoom CHƯA bị kẹp nên tâm lệch hẳn khỏi các điểm (ví dụ tờ đáy che phần lớn màn nhỏ); khi đó đứng ở mức xa nhất và để `padding` dịch tâm.
 */
export function flyToBounds(gl: MlMap, bounds: LngLatBounds, padding: PaddingOptions, maxZoom: number, duration: number): void {
  // MapLibre 6 cộng padding tương đối vào padding đang giữ; inset của app là giá trị tuyệt đối cho từng màn.
  const camera = gl.cameraForBounds(bounds, { padding, maxZoom, absolutePadding: true });
  if (camera?.zoom !== undefined && camera.zoom < MAP.GL_MIN_ZOOM) {
    gl.easeTo({ center: bounds.getCenter(), zoom: MAP.GL_MIN_ZOOM, padding, duration, essential: true });
    return;
  }
  gl.fitBounds(bounds, { padding, maxZoom, absolutePadding: true, duration, essential: true });
}
