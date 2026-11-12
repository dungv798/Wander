import { MEDIA } from '../const/app.const.ts';
import { MAP } from './map.const.ts';
import type { MapMarker } from './map.types.ts';

/** Whether two pin lists are identical (same id, coordinates, label, number, photo, kind): to skip rebuilding when only the array reference changes. */
export function sameMarkers(a: readonly MapMarker[], b: readonly MapMarker[]): boolean {
  return a.length === b.length && a.every((m, i) => JSON.stringify(m) === JSON.stringify(b[i]));
}

/** The user asked for reduced motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia(MEDIA.REDUCED_MOTION).matches;
}

/** An external map link (OpenStreetMap) to the first pin; with no pin it shows the whole country. Used when the in-app map cannot open. */
export function externalMapHref(markers: readonly Pick<MapMarker, 'lat' | 'lon'>[]): string {
  const first = markers[0];
  if (!first) return `https://www.openstreetmap.org/#map=${MAP.EXTERNAL_COUNTRY}`;
  return `https://www.openstreetmap.org/?mlat=${first.lat}&mlon=${first.lon}#map=${MAP.EXTERNAL_ZOOM}/${first.lat}/${first.lon}`;
}

/** Whether the browser can create a WebGL context (MapLibre needs it). */
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

/** Reads any CSS color (including a resolved `var()`) into [r, g, b] in 0..1 using a 1x1 canvas. */
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
