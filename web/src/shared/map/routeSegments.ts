import type { Feature, LineString } from 'geojson';
import { COPY, fill } from '../const/copy.vi.ts';
import { roadKmBetween } from '../lib/geo.ts';
import { arcBetween } from './geoRoute.ts';
import { ROUTE } from './route.const.ts';
import type { MapMarker, MapRoute, Pt, RouteSegment } from './map.types.ts';

/** Nhãn km luôn chỉ rõ ước tính, làm tròn nhưng giữ đoạn ngắn tối thiểu 1 km. */
export function formatRouteKm(km: number): string {
  return fill(COPY.map.remainingKm, { km: Math.max(1, Math.round(km)) });
}

/** Xoay tối đa sáu token theo chỉ số ngày bắt đầu từ 0. */
export function routeDayToken(day: number): string {
  return ROUTE.TOKENS[((Math.trunc(day) % ROUTE.TOKENS.length) + ROUTE.TOKENS.length) % ROUTE.TOKENS.length]!;
}

/** Định danh ổn định theo ngày và hai đầu mút; km dùng cùng hệ số đường núi của danh sách. */
export function makeRouteSegment(from: MapMarker, to: MapMarker, day: number, order: number): RouteSegment {
  return { id: JSON.stringify([day, from.id, to.id]), from: from.id, to: to.id, day, order, km: roadKmBetween(from, to) };
}

/** Nối các địa điểm theo thứ tự từng ngày; ghim thiếu ngắt tuyến, không nối giữa hai ngày. */
export function routeSegmentsForDays(days: readonly (readonly string[])[], markers: readonly MapMarker[]): RouteSegment[] {
  const byId = new Map(markers.map((marker) => [marker.id, marker]));
  return days.flatMap((ids, day) => ids.slice(1).flatMap((id, index) => {
    const from = byId.get(ids[index]!), to = byId.get(id);
    return from && to ? [makeRouteSegment(from, to, day, index + 1)] : [];
  }));
}

/** Dựng feature từng đoạn; thiếu ghim thì bỏ đúng đoạn, tuyệt đối không nối tắt qua ghim thiếu. */
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

/** Khoảng cách bình phương từ điểm chạm đến đường gấp khúc trên màn hình, kể cả đoạn trùng điểm. */
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

/** Chỉ chọn một đối tượng: ghim/cụm trước đoạn; trong các đoạn chọn hình học gần nhất. */
export function nearestMapObject(hits: readonly { id: string; kind: 'pin' | 'cluster' | 'segment'; line: readonly Pt[] }[], point: Pt): string | null {
  const pins = hits.filter((hit) => hit.kind === 'pin');
  const pool = pins.length ? pins : hits.some((hit) => hit.kind === 'cluster') ? hits.filter((hit) => hit.kind === 'cluster') : hits;
  return [...pool].sort((a, b) => {
    /** Ghim/cụm chỉ có một tọa độ nên dùng khoảng cách đến tâm. */
    const distance = (line: readonly Pt[]) => line.length === 1 ? Math.hypot(point[0] - line[0]![0], point[1] - line[0]![1]) ** ROUTE.HALF : distanceToLine(point, line);
    return distance(a.line) - distance(b.line) || a.id.localeCompare(b.id);
  })[0]?.id ?? null;
}
