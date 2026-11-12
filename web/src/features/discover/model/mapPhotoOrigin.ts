import type { PhotoOrigin } from '../../../shared/ui/photoTransition.ts';
import { MAP } from '../../../shared/map/map.const.ts';

/** Captures the native photo pin frame from the drawn coordinates; it does not guess the position when the pin is not shown. */
export function mapPhotoOrigin(id: string, url: string, selector: string): PhotoOrigin | null {
  const maps = [...document.querySelectorAll<HTMLElement>(selector)];
  for (const map of maps.reverse()) {
    try {
      const points = JSON.parse(map.dataset['features'] ?? '[]') as { id: string; cluster: boolean; x: number; y: number }[];
      const point = points.find((p) => !p.cluster && p.id === id);
      if (!point) continue;
      const frame = map.getBoundingClientRect();
      return { element: null, url, rect: new DOMRect(frame.left + point.x - MAP.PIN_RADIUS, frame.top + point.y - MAP.PIN_RADIUS, MAP.PIN_PX, MAP.PIN_PX) };
    } catch { /* No photo/pin frame: opens instantly with the provider fallback. */ }
  }
  return null;
}
