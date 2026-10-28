import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { MAP } from './map.const.ts';
import { cssColorToRgb } from './mapUtil.ts';
import type { Pt } from './map.types.ts';

const RGB_MAX = 255;
const EMPTY_LINES = { type: 'FeatureCollection', features: [] } as const;

/** Màu CSS của một token (`--map-route`…) thành chuỗi `rgb(...)` mà MapLibre đọc được. */
function tokenColor(host: HTMLElement, token: string): string {
  const [r, g, b] = cssColorToRgb(getComputedStyle(host).getPropertyValue(token).trim());
  return `rgb(${Math.round(r * RGB_MAX)}, ${Math.round(g * RGB_MAX)}, ${Math.round(b * RGB_MAX)})`;
}

/** Thêm nguồn GeoJSON rỗng và hai lớp đường (viền sáng + nét màu) cho tuyến; màu lấy từ token `--map-*` của `host`. */
export function addRouteLayers(map: MlMap, host: HTMLElement): void {
  map.addSource(MAP.ROUTE_SOURCE_ID, { type: 'geojson', data: EMPTY_LINES });
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  map.addLayer({ id: MAP.ROUTE_HALO_LAYER_ID, type: 'line', source: MAP.ROUTE_SOURCE_ID, layout, paint: { 'line-color': tokenColor(host, '--map-route-halo'), 'line-width': MAP.ROUTE_HALO_WIDTH, 'line-opacity': MAP.ROUTE_HALO_OPACITY } });
  map.addLayer({ id: MAP.ROUTE_LINE_LAYER_ID, type: 'line', source: MAP.ROUTE_SOURCE_ID, layout, paint: { 'line-color': tokenColor(host, '--map-route'), 'line-width': MAP.ROUTE_WIDTH } });
}

/** Đặt các cung tuyến (mỗi cung là danh sách [kinh độ, vĩ độ]) vào lớp tuyến; rỗng thì xóa tuyến. */
export function setRouteLines(map: MlMap | null, lines: readonly (readonly Pt[])[]): void {
  const source = map?.getSource(MAP.ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
  source?.setData({ type: 'FeatureCollection', features: lines.map((coordinates) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coordinates.map((c) => [...c]) } })) });
}
