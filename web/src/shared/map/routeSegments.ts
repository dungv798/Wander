import type { Feature, LineString } from 'geojson';
import { COPY, fill } from '../const/copy.vi.ts';
import { roadKmBetween } from '../lib/geo.ts';
import { arcBetween } from './geoRoute.ts';
import { ROUTE } from './route.const.ts';
import type { MapMarker, MapRoute, Pt, RouteSegment } from './map.types.ts';

/** The km label always clearly says estimate, rounded but keeping a short segment at least 1 km. */
export function formatRouteKm(km: number): string {
  return fill(COPY.map.remainingKm, { km: Math.max(1, Math.round(km)) });
}

/** Rotates at most six tokens by the day index starting from 0. */
export function routeDayToken(day: number): string {
  return ROUTE.TOKENS[((Math.trunc(day) % ROUTE.TOKENS.length) + ROUTE.TOKENS.length) % ROUTE.TOKENS.length]!;
}

/** A stable identity by day and the two endpoints; km uses the same mountain-road factor as the list. */
export function makeRouteSegment(from: MapMarker, to: MapMarker, day: number, order: number): RouteSegment {
  return { id: JSON.stringify([day, from.id, to.id]), from: from.id, to: to.id, day, order, km: roadKmBetween(from, to) };
}

/** Connects the places in order for each day; a missing pin breaks the route, no connection between two days. */
export function routeSegmentsForDays(days: readonly (readonly string[])[], markers: readonly MapMarker[]): RouteSegment[] {
  const byId = new Map(markers.map((marker) => [marker.id, marker]));
  return days.flatMap((ids, day) => ids.slice(1).flatMap((id, index) => {
    const from = byId.get(ids[index]!), to = byId.get(id);
    return from && to ? [makeRouteSegment(from, to, day, index + 1)] : [];
  }));
}

/** Builds the feature of each segment; a missing pin drops exactly that segment, never a shortcut across the missing pin. */
export function routeSegmentFeatures(route: MapRoute | null, markers: readonly MapMarker[]): Feature<LineString, RouteSegment>[] {
  if (!route) return [];
  const byId = new Map(markers.map((marker) => [marker.id, marker]));
  const segments = route.segments ?? route.ids.slice(1).flatMap((id, index) => {
    const from = byId.get(route.ids[index]!);
    const to = byId.get(id);
    return from && to ? [makeRouteSegment(from, to, 0, index + 1)] : [];
  });
  return segments.flatMap((segment) => {
    const from = byId.get(segment.from);
    const to = byId.get(segment.to);
    if (!from || !to) return [];
    const { line } = arcBetween([from.lon, from.lat], [to.lon, to.lat]);
    return [{ type: 'Feature', id: segment.id, properties: segment, geometry: { type: 'LineString', coordinates: line.map((point) => [...point]) } }];
  });
}

/** The squared distance from the touch point to the polyline on the screen, including a segment with coincident points. */
function distanceToLine(point: Pt, line: readonly Pt[]): number {
  let nearest = Infinity;
  line.slice(1).forEach((b, index) => {
    const a = line[index]!;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length)) : 0;
    nearest = Math.min(nearest, (point[0] - a[0] - t * dx) ** ROUTE.HALF + (point[1] - a[1] - t * dy) ** ROUTE.HALF);
  });
  return nearest;
}

/** Selects only one object: a pin/cluster before a segment; among segments it picks the nearest geometry. */
export function nearestMapObject(hits: readonly { id: string; kind: 'pin' | 'cluster' | 'segment'; line: readonly Pt[] }[], point: Pt): string | null {
  const pins = hits.filter((hit) => hit.kind === 'pin');
  const pool = pins.length ? pins : hits.some((hit) => hit.kind === 'cluster') ? hits.filter((hit) => hit.kind === 'cluster') : hits;
  return [...pool].sort((a, b) => {
    /** A pin/cluster has only one coordinate so the distance to the center is used. */
    const distance = (line: readonly Pt[]) => line.length === 1 ? Math.hypot(point[0] - line[0]![0], point[1] - line[0]![1]) ** ROUTE.HALF : distanceToLine(point, line);
    return distance(a.line) - distance(b.line) || a.id.localeCompare(b.id);
  })[0]?.id ?? null;
}
