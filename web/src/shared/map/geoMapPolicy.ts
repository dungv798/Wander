import { MAP } from './map.const.ts';
import { airKm } from '../lib/geo.ts';
import type { FitOptions, Insets, Pt, Size } from './map.types.ts';

/** The minimum visible area (px) on each axis after subtracting the two margins, so MapLibre does not compute a negative size. */
const MIN_VISIBLE_PX = 2;

/** Re-fits only when the inset really changed and the camera has not been adjusted by the user or a pin has been covered. */
export function needsInsetRefit(before: Insets, after: Insets, touched: boolean, visible: boolean): boolean {
  const changed = before.top !== after.top || before.right !== after.right || before.bottom !== after.bottom || before.left !== after.left;
  return changed && (!touched || !visible);
}

/** The closer a pair of points, the larger the zoom; fitBounds still keeps both points, a cluster keeps its own ceiling. */
export function fitMaxZoom(options: FitOptions, points: readonly Pt[] = []): number {
  const [a, b] = points;
  let limit: number = points.length > MAP.FIT_SMALL_COUNT ? MAP.FIT_REGION_ZOOM : MAP.GL_FIT_MAX_ZOOM;
  if (a && b && points.length === MAP.FIT_SMALL_COUNT) {
    const distance = airKm({ lon: a[0], lat: a[1] }, { lon: b[0], lat: b[1] });
    limit = distance <= MAP.FIT_NEAR_KM ? MAP.FIT_NEAR_ZOOM : distance <= MAP.FIT_LOCAL_KM ? MAP.FIT_LOCAL_ZOOM : distance <= MAP.FIT_CITY_KM ? MAP.FIT_CITY_ZOOM : MAP.FIT_REGION_ZOOM;
  }
  return Math.max(MAP.GL_MIN_ZOOM, Math.min(MAP.GL_MAX_ZOOM, options.maxZoom ?? limit));
}

/** The px margin that keeps pins and names away from the edge/attribution; a shrinking frame still has a positive visible area. */
export function fitPadding(size: Size, inset: Insets, pad: number = MAP.FIT_PADDING, credit = false): Insets {
  const side = Math.max(pad, MAP.FIT_LABEL_SIDE);
  const [top, bottom] = fitAxis(inset.top + pad, inset.bottom + pad + MAP.FIT_LABEL_SPACE + (credit ? MAP.CREDIT_BAND : 0), size.h);
  const [left, right] = fitAxis(inset.left + side, inset.right + side, size.w);
  return { top, bottom, left, right };
}

/**
 * The two opposite margins on an axis: kept as they are while their sum still leaves a positive visible area, otherwise scaled proportionally so the sum < the length.
 * (Before, each margin was clamped at half the length so a bottom sheet covering 60% of the frame made the camera fit under the sheet.)
 */
function fitAxis(near: number, far: number, length: number): [number, number] {
  const room = Math.max(0, length - MIN_VISIBLE_PX);
  const total = near + far;
  if (total <= room) return [Math.max(0, near), Math.max(0, far)];
  const scale = room / total;
  return [Math.floor(near * scale), Math.floor(far * scale)];
}

/** Accepts base source/tile errors; the app's route and pin data are not a base source. */
export function isBasemapError(event: { error?: unknown; sourceId?: string; source?: unknown; tile?: unknown }): boolean {
  return event.sourceId !== MAP.ROUTE_SOURCE_ID && !MAP.PIN_SOURCES.some((source) => source === event.sourceId) && Boolean(event.sourceId || event.source || event.tile);
}
