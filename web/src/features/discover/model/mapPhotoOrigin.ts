import type { PhotoOrigin } from '../../../shared/ui/photoTransition.ts';
import { MAP } from '../../../shared/map/map.const.ts';

/** Chụp khung ghim ảnh native từ tọa độ đã vẽ; không suy đoán vị trí khi ghim chưa hiện. */
export function mapPhotoOrigin(id: string, url: string, selector: string): PhotoOrigin | null {
  const maps = [...document.querySelectorAll<HTMLElement>(selector)];
  for (const map of maps.reverse()) {
    try {
      const points = JSON.parse(map.dataset['features'] ?? '[]') as { id: string; cluster: boolean; x: number; y: number }[];
      const point = points.find((p) => !p.cluster && p.id === id);
      if (!point) continue;
      const frame = map.getBoundingClientRect();
      return { element: null, url, rect: new DOMRect(frame.left + point.x - MAP.PIN_RADIUS, frame.top + point.y - MAP.PIN_RADIUS, MAP.PIN_PX, MAP.PIN_PX) };
    } catch { /* Thiếu ảnh/khung ghim: mở tức thời bằng fallback của provider. */ }
  }
  return null;
}
