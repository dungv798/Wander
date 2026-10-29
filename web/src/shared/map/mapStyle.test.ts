import test from 'node:test';
import assert from 'node:assert/strict';
import { createExpression, validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { StyleSpecification } from 'maplibre-gl';
import { loadMapStyle, restyleMap } from './mapStyle.ts';
import { MAP } from './map.const.ts';

const COLORS = { water: 'rgb(143,211,251)', land: 'rgb(255,252,243)', park: 'rgb(226,239,233)', road: 'rgb(255,255,255)', mainRoad: 'rgb(255,230,138)', casing: 'rgb(244,229,203)', label: 'rgb(69,80,106)', halo: 'rgb(255,255,255)', boundary: 'rgb(167,181,194)' };

/** Mẫu cấu trúc Liberty/OpenMapTiles ngoại tuyến; không giả làm bản Liberty tải thật. */
function baseStyle(): StyleSpecification {
  return {
    version: 8, glyphs: 'https://example.test/{fontstack}/{range}.pbf',
    sources: {
      openmaptiles: { type: 'vector', tiles: ['https://example.test/{z}/{x}/{y}.pbf'], attribution: 'OSM / OpenFreeMap / OpenMapTiles' },
      dem: { type: 'raster-dem', tiles: ['https://example.test/{z}/{x}/{y}.png'], attribution: 'Độ cao: Mapzen, AWS Open Data' },
    },
    terrain: { source: 'dem' },
    layers: [
      { id: 'background', type: 'background' },
      { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water' },
      { id: 'park', type: 'fill', source: 'openmaptiles', 'source-layer': 'park' },
      { id: 'landcover', type: 'fill', source: 'openmaptiles', 'source-layer': 'landcover' },
      { id: 'landuse', type: 'fill', source: 'openmaptiles', 'source-layer': 'landuse' },
      { id: 'hillshade', type: 'hillshade', source: 'dem' },
      { id: 'contour', type: 'line', source: 'openmaptiles', 'source-layer': 'contour' },
      { id: 'peak', type: 'symbol', source: 'openmaptiles', 'source-layer': 'mountain_peak' },
      { id: 'highway_motorway_casing', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 5, maxzoom: 18, filter: ['==', 'class', 'motorway'], paint: { 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 18, 12], 'line-gap-width': 2 } },
      { id: 'highway_primary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation' },
      { id: 'highway_minor', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', minzoom: 8 },
      { id: 'waterway', type: 'line', source: 'openmaptiles', 'source-layer': 'waterway' },
      { id: 'boundary', type: 'line', source: 'openmaptiles', 'source-layer': 'boundary' },
      { id: 'place', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', layout: { 'text-field': ['format', ['get', 'name:latin'], {}, '\n', {}, ['get', 'name'], {}], 'text-size': 14 } },
      { id: 'poi', type: 'symbol', source: 'openmaptiles', 'source-layer': 'poi', layout: { 'text-field': ['get', 'name'], 'text-size': 12 } },
      { id: 'road_ref', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', layout: { 'text-field': ['get', 'ref'] } },
      { id: 'highway-shield-non-us', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', layout: { 'text-field': ['to-string', ['get', 'ref']], 'icon-image': ['concat', 'road_', ['get', 'ref_length']] } },
      { id: 'legacy_label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'transportation_name', layout: { 'text-field': '{name:latin} · {ref}' } },
    ],
  };
}

test('style nền phẳng qua validator; bỏ DEM/địa hình, giữ ghi công vector và không đổi đầu vào', () => {
  const original = baseStyle();
  const snapshot = structuredClone(original);
  const result = restyleMap(original, COLORS);
  assert.deepEqual(validateStyleMin(result), []);
  assert.deepEqual(original, snapshot);
  assert.equal(result.terrain, undefined);
  assert.equal(result.sources['dem'], undefined);
  assert.deepEqual(result.sources['openmaptiles'], original.sources['openmaptiles']);
  assert.equal(result.layers.some((layer) => /hillshade|contour|peak/.test(layer.id)), false);
  assert.equal(JSON.stringify(result).includes('Mapzen'), false);
});

test('giữ thứ tự, filter, zoom, casing/độ dày đường; màu và chi tiết nhỏ theo đặc tả', () => {
  const original = baseStyle();
  const result = restyleMap(original, COLORS);
  const casing = result.layers.find((layer) => layer.id === 'highway_motorway_casing');
  const before = original.layers.find((layer) => layer.id === casing?.id);
  assert.ok(casing?.type === 'line' && before?.type === 'line');
  assert.deepEqual(casing.filter, before.filter);
  assert.equal(casing.minzoom, before.minzoom);
  assert.equal(casing.maxzoom, before.maxzoom);
  assert.deepEqual(casing.paint?.['line-width'], before.paint?.['line-width']);
  assert.equal(casing.paint?.['line-gap-width'], before.paint?.['line-gap-width']);
  assert.equal(casing.paint?.['line-color'], COLORS.casing);
  const minor = result.layers.find((layer) => layer.id === 'highway_minor');
  assert.ok(minor?.type === 'line');
  assert.equal(minor.minzoom, 8);
  assert.deepEqual(minor.paint?.['line-opacity'], ['interpolate', ['linear'], ['zoom'], MAP.MINOR_ROAD_ZOOM, 0, MAP.MINOR_ROAD_ZOOM + MAP.DETAIL_FADE_ZOOMS, 1]);
  assert.deepEqual(result.layers.map((layer) => layer.id), original.layers.filter((layer) => !['hillshade', 'contour', 'peak'].includes(layer.id)).map((layer) => layer.id));
  const water = result.layers.find((layer) => layer.id === 'water');
  assert.ok(water?.type === 'fill');
  assert.equal(water.paint?.['fill-color'], COLORS.water);
});

test('nhãn ưu tiên tiếng Việt rồi tên gốc, giữ format/ref và halo sáng, không ép in hoa', () => {
  const result = restyleMap(baseStyle(), COLORS);
  const poi = result.layers.find((layer) => layer.id === 'poi');
  const place = result.layers.find((layer) => layer.id === 'place');
  const ref = result.layers.find((layer) => layer.id === 'road_ref');
  assert.ok(poi?.type === 'symbol' && place?.type === 'symbol' && ref?.type === 'symbol');
  const parsed = createExpression(poi.layout?.['text-field'], 'text-field');
  assert.equal(parsed.result, 'success');
  if (parsed.result === 'success') {
    assert.equal(parsed.value.evaluate({ zoom: 14 }, { type: 'Point', properties: { 'name:vi': 'Hồ Xuân Hương', name: 'Xuan Huong' } }), 'Hồ Xuân Hương');
    assert.equal(parsed.value.evaluate({ zoom: 14 }, { type: 'Point', properties: { name: 'Dalat' } }), 'Dalat');
  }
  assert.equal((place.layout?.['text-field'] as unknown[])[0], 'format');
  assert.deepEqual(ref.layout?.['text-field'], ['get', 'ref']);
  assert.equal(poi.layout?.['text-transform'], 'none');
  assert.equal(poi.paint?.['text-halo-color'], COLORS.halo);
  assert.equal(poi.paint?.['text-halo-width'], MAP.BASE_LABEL_HALO);
  const legacy = result.layers.find((layer) => layer.id === 'legacy_label');
  assert.ok(legacy?.type === 'symbol');
  const formatted = createExpression(legacy.layout?.['text-field'], 'text-field');
  assert.equal(formatted.result, 'success');
  if (formatted.result === 'success') assert.equal(formatted.value.evaluate({ zoom: 14 }, { type: 'Point', properties: { 'name:vi': 'Đường mới', ref: 'QL20' } }).toString(), 'Đường mới · QL20');
  assert.deepEqual(poi.paint?.['text-opacity'], ['interpolate', ['linear'], ['zoom'], MAP.SMALL_LABEL_ZOOM, 0, MAP.SMALL_LABEL_ZOOM + MAP.DETAIL_FADE_ZOOMS, 1]);
});

test('loader báo lỗi HTTP cho cơ chế thử lại hiện có, không yêu cầu tile/DEM', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    assert.equal(url, MAP.STYLE_URL);
    return new Response(null, { status: 503 });
  });
  await assert.rejects(loadMapStyle({} as HTMLElement), /style 503/);
});

test('loader đọc màu từ token của host, chỉ tải style; bản đồ không còn nguồn ghi công độ cao', async (t) => {
  const host = {} as HTMLElement;
  const properties: Record<string, string> = Object.fromEntries(Object.values(MAP.BASE_TOKENS).map((token) => [token, 'rgb(255,255,255)']));
  properties[MAP.BASE_TOKENS.water] = 'rgb(143,211,251)';
  const context = { fillStyle: '', clearRect() {}, fillRect() {}, getImageData() { return { data: [...(this.fillStyle.match(/\d+/g) ?? []).map(Number), 255] }; } };
  for (const [name, value] of Object.entries({
    getComputedStyle: (element: HTMLElement) => { assert.equal(element, host); return { getPropertyValue: (token: string) => properties[token] ?? '' }; },
    document: { createElement: () => ({ getContext: () => context }) },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const requested: unknown[] = [];
  t.mock.method(globalThis, 'fetch', async (url: unknown) => { requested.push(url); return Response.json(baseStyle()); });
  const result = await loadMapStyle(host);
  assert.deepEqual(requested, [MAP.STYLE_URL]);
  assert.deepEqual(validateStyleMin(result), []);
  const water = result.layers.find((layer) => layer.id === 'water');
  assert.ok(water?.type === 'fill');
  assert.equal(water.paint?.['fill-color'], COLORS.water);
  assert.equal(JSON.stringify(result).includes('AWS'), false);
});

test('biển số đường giữ nguyên số hiệu ref, không bị đổi sang tên địa danh', () => {
  const result = restyleMap(baseStyle(), COLORS);
  const shield = result.layers.find((layer) => layer.id === 'highway-shield-non-us');
  assert.deepEqual((shield as { layout?: Record<string, unknown> } | undefined)?.layout?.['text-field'], ['to-string', ['get', 'ref']]);
});
