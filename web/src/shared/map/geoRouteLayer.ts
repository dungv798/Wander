import type { Feature, LineString } from 'geojson';
import type { ExpressionSpecification, GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { MAP } from './map.const.ts';
import { pinColor } from './nativePinLayers.ts';
import { ROUTE } from './route.const.ts';
import { routeDayToken } from './routeSegments.ts';
import type { RouteSegment } from './map.types.ts';

export type SegmentFeature = Feature<LineString, RouteSegment>;
const EMPTY_LINES = { type: 'FeatureCollection' as const, features: [] };

/** Adds the estimated route, a wide hit area and a canvas arrow without loading a sprite over the network. */
export function addRouteLayers(map: MlMap, host: HTMLElement): void {
  if (map.getSource(MAP.ROUTE_SOURCE_ID)) return;
  map.addSource(MAP.ROUTE_SOURCE_ID, { type: 'geojson', data: EMPTY_LINES });
  map.addSource(ROUTE.HIT_LAYER, { type: 'geojson', data: EMPTY_LINES });
  const layout = { 'line-cap': 'round', 'line-join': 'round' } as const;
  map.addLayer({ id: MAP.ROUTE_HALO_LAYER_ID, type: 'line', source: MAP.ROUTE_SOURCE_ID, layout, paint: { 'line-color': pinColor(host, '--map-route-halo'), 'line-width': MAP.ROUTE_HALO_WIDTH, 'line-opacity': MAP.ROUTE_HALO_OPACITY } });
  map.addLayer({ id: MAP.ROUTE_LINE_LAYER_ID, type: 'line', source: MAP.ROUTE_SOURCE_ID, layout, paint: {
    'line-color': ['to-color', ['at', ['%', ['get', 'day'], ROUTE.TOKENS.length], ['literal', ROUTE.TOKENS.map((token) => pinColor(host, token))]]] as ExpressionSpecification,
    'line-width': MAP.ROUTE_WIDTH, 'line-opacity': ROUTE.OPACITY, 'line-dasharray': [...ROUTE.DASH],
  } });
  map.addLayer({ id: ROUTE.HIT_LAYER, type: 'line', source: ROUTE.HIT_LAYER, layout, paint: { 'line-width': ROUTE.HIT_WIDTH, 'line-opacity': 0 } });
  addRouteArrow(map, host);
}

/** Draws a chevron pointing right; MapLibre rotates it by itself along the tangent of the line. */
function addRouteArrow(map: MlMap, host: HTMLElement): void {
  ROUTE.TOKENS.forEach((_, day) => {
    const imageId = `${ROUTE.ARROW_IMAGE}-${day}`;
    if (map.hasImage(imageId)) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = ROUTE.ARROW_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = pinColor(host, routeDayToken(day));
    ctx.lineWidth = ROUTE.ARROW_STROKE;
    ctx.beginPath();
    ctx.moveTo(ROUTE.ARROW_START, ROUTE.ARROW_START);
    ctx.lineTo(ROUTE.ARROW_END, ROUTE.ARROW_MIDDLE);
    ctx.lineTo(ROUTE.ARROW_START, ROUTE.ARROW_END);
    ctx.stroke();
    map.addImage(imageId, ctx.getImageData(0, 0, ROUTE.ARROW_PX, ROUTE.ARROW_PX));
  });
  map.addLayer({ id: ROUTE.ARROW_LAYER, type: 'symbol', source: MAP.ROUTE_SOURCE_ID, layout: {
    'symbol-placement': 'line', 'symbol-spacing': ROUTE.ARROW_SPACING, 'icon-image': ['concat', ROUTE.ARROW_IMAGE + '-', ['to-string', ['%', ['get', 'day'], ROUTE.TOKENS.length]]],
    'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-rotation-alignment': 'map', 'icon-keep-upright': false,
  } });
}

/** Syncs each feature with the metadata; the hit source is always complete while the effect is drawing. */
export function setRouteLines(map: MlMap, features: readonly SegmentFeature[], hit = true): void {
  const data = { type: 'FeatureCollection' as const, features: [...features] };
  (map.getSource(MAP.ROUTE_SOURCE_ID) as GeoJSONSource | undefined)?.setData(data);
  if (hit) (map.getSource(ROUTE.HIT_LAYER) as GeoJSONSource | undefined)?.setData(data);
}
