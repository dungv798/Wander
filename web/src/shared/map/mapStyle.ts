import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import { MAP } from './map.const.ts';
import { cssColorToRgb } from './mapUtil.ts';
import { withVietnamLabels } from './vietnamLabels.ts';

type Palette = Record<keyof typeof MAP.BASE_TOKENS, string>;
const LABEL_FIELD: ExpressionSpecification = ['coalesce', ['get', 'name:vi'], ['get', 'name']];
const RELIEF = /hillshade|contour|mountain[_-]?peak|terrain[_-]?shad/i;
const MINOR_ROAD = /minor|path|track|service|residential|pedestrian|steps|cycleway/i;
const MAIN_ROAD = /motorway|trunk|primary|secondary|tertiary/i;
/** The road-shield layer shows the `ref` number (like 'QL.27'), not a place name so the original label is kept. */
const ROAD_SHIELD = /shield/i;
const SMALL_LABELS = new Set(['poi', 'transportation_name', 'waterway', 'housenumber']);
const SMALL_PLACES = /village|hamlet|suburb|neighbourhood|quarter|isolated[_-]dwelling/i;

/** Reads the resolved token and mixes it with a white background by a ratio; the RGB result is usable in MapLibre. */
function mixedToken(css: CSSStyleDeclaration, token: string, tint = 1): string {
  const foreground = cssColorToRgb(css.getPropertyValue(token).trim());
  const background = cssColorToRgb(css.getPropertyValue(MAP.BASE_TOKENS.halo).trim());
  return `rgb(${foreground.map((channel, index) => Math.round((channel * tint + background[index]! * (1 - tint)) * MAP.RGB_MAX)).join(',')})`;
}

/** Takes the palette at the element that contains the map, keeping the token as the single source of color. */
function readPalette(host: HTMLElement): Palette {
  const css = getComputedStyle(host);
  const tints: Partial<Record<keyof Palette, number>> = { land: MAP.LAND_TINT, park: MAP.PARK_TINT, casing: MAP.CASING_TINT, boundary: MAP.BOUNDARY_TINT };
  return Object.fromEntries(Object.entries(MAP.BASE_TOKENS).map(([key, token]) => [key, mixedToken(css, token, tints[key as keyof Palette])])) as Palette;
}

/** Only replaces the name-reading step; keeps Liberty's format, conditional branches and road numbers. */
function vietnameseName(value: unknown): unknown {
  if (typeof value === 'string' && /\{name(?::[^}]+)?\}/.test(value)) {
    if (/^\{name(?::[^}]+)?\}$/.test(value)) return LABEL_FIELD;
    return ['format', ...value.split(/(\{[^}]+\})/).filter(Boolean).flatMap((part) => [
      /^\{name(?::[^}]+)?\}$/.test(part) ? LABEL_FIELD : /^\{[^}]+\}$/.test(part) ? ['get', part.slice(1, -1)] : part, {},
    ])];
  }
  if (!Array.isArray(value)) return value;
  if (value[0] === 'literal') return value;
  // Liberty uses both format and case/concat to combine two languages; the whole expression is replaced so the same Vietnamese name is not repeated.
  if ((value[0] === 'format' || value[0] === 'case') && JSON.stringify(value).includes('"name:nonlatin"')) return LABEL_FIELD;
  if (value[0] === 'get' && typeof value[1] === 'string' && /^name(?::|$)/.test(value[1])) return LABEL_FIELD;
  return value.map(vietnameseName);
}

/** Hides detail at a low zoom by opacity; it does not change the filter, minzoom/maxzoom or the casing thickness. */
function detailOpacity(zoom: number, opacity: unknown): ExpressionSpecification {
  return ['interpolate', ['linear'], ['zoom'], zoom, 0, zoom + MAP.DETAIL_FADE_ZOOMS, typeof opacity === 'number' ? opacity : 1];
}

/** Changes paint/layout by source-layer; keeps the order and road geometry of Liberty. */
function restyleLayer(layer: LayerSpecification, colors: Palette): LayerSpecification {
  const source = 'source-layer' in layer ? layer['source-layer'] : '';
  if (layer.type === 'background') return { ...layer, paint: { ...layer.paint, 'background-color': colors.land } };
  if (layer.type === 'fill') {
    const color = source === 'water' ? colors.water : source === 'transportation' ? colors.road : ['landcover', 'park'].includes(source ?? '') ? colors.park : colors.land;
    if (!['water', 'landcover', 'landuse', 'park', 'building', 'transportation'].includes(source ?? '')) return layer;
    return { ...layer, paint: { ...layer.paint, 'fill-color': color, 'fill-outline-color': color } };
  }
  if (layer.type === 'line') {
    let color: string | undefined;
    if (source === 'waterway') color = colors.water;
    if (source === 'boundary') color = colors.boundary;
    if (source === 'transportation') color = /casing|outline/i.test(layer.id) ? colors.casing : MAIN_ROAD.test(layer.id) ? colors.mainRoad : colors.road;
    if (!color) return layer;
    const paint = { ...layer.paint, 'line-color': color };
    if (source === 'transportation' && MINOR_ROAD.test(layer.id)) paint['line-opacity'] = detailOpacity(MAP.MINOR_ROAD_ZOOM, layer.paint?.['line-opacity']);
    return { ...layer, paint };
  }
  if (layer.type !== 'symbol' || !layer.layout?.['text-field'] || ROAD_SHIELD.test(layer.id)) return layer;
  const layout ={ ...layer.layout, 'text-field': vietnameseName(layer.layout['text-field']) as ExpressionSpecification, 'text-transform': 'none' as const };
  const paint = { ...layer.paint, 'text-color': colors.label, 'text-halo-color': colors.halo, 'text-halo-width': MAP.BASE_LABEL_HALO };
  if (SMALL_LABELS.has(source ?? '') || (source === 'place' && SMALL_PLACES.test(layer.id))) paint['text-opacity'] = detailOpacity(MAP.SMALL_LABEL_ZOOM, layer.paint?.['text-opacity']);
  return { ...layer, layout, paint };
}

/** Removes the DEM and the terrain layers completely; keeps the vector source, the attribution and the native layers that exist. */
export function restyleMap(style: StyleSpecification, colors: Palette): StyleSpecification {
  const sources = Object.fromEntries(Object.entries(style.sources).filter(([, source]) => source.type !== 'raster-dem'));
  const layers = style.layers.filter((layer) => layer.type !== 'hillshade' && layer.type !== 'raster' && !RELIEF.test(layer.id) && !('source-layer' in layer && RELIEF.test(layer['source-layer'] ?? '')) && !('source' in layer && !sources[layer.source]));
  const { terrain: _terrain, ...flatStyle } = style;
  return { ...flatStyle, sources, layers: layers.map((layer) => restyleLayer(layer, colors)) };
}

/** Loads Liberty and applies the Wander palette; a network error is passed to the existing retry button. */
export async function loadMapStyle(host: HTMLElement = document.documentElement): Promise<StyleSpecification> {
  const res = await fetch(MAP.STYLE_URL);
  if (!res.ok) throw new Error(`style ${res.status}`);
  const palette = readPalette(host);
  return withVietnamLabels(restyleMap((await res.json()) as StyleSpecification, palette), palette.label, palette.halo);
}
