import type { LngLatBounds, Map as MlMap, PaddingOptions } from 'maplibre-gl';
import { MAP } from './map.const.ts';

/**
 * Puts the camera into a frame that fits the points. When the visible area is smaller than the whole frame at the farthest allowed zoom, `fitBounds` computes the center at the
 * zoom that has NOT been clamped so the center shifts far from the points (for example a bottom sheet covers most of a small screen); then it stays at the farthest level and lets `padding` shift the center.
 */
export function flyToBounds(gl: MlMap, bounds: LngLatBounds, padding: PaddingOptions, maxZoom: number, duration: number): void {
  // MapLibre 6 adds the padding relatively to the padding it already holds; the app's inset is an absolute value for each screen.
  const camera = gl.cameraForBounds(bounds, { padding, maxZoom, absolutePadding: true });
  if (camera?.zoom !== undefined && camera.zoom < MAP.GL_MIN_ZOOM) {
    gl.easeTo({ center: bounds.getCenter(), zoom: MAP.GL_MIN_ZOOM, padding, duration, essential: true });
    return;
  }
  gl.fitBounds(bounds, { padding, maxZoom, absolutePadding: true, duration, essential: true });
}
