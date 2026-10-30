import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStyleMin, createExpression } from '@maplibre/maplibre-gl-style-spec';
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';
import { addRouteLayers } from './geoRouteLayer.ts';
import { MAP } from './map.const.ts';
import { ROUTE } from './route.const.ts';

test('style tuyến hợp lệ: hit đủ 28 px, nét đứt nhạt và sprite hướng đi lặp theo đường, không nhân lớp khi khôi phục', (t) => {
  const pixels = { data: [0, 0, 0, 255] };
  for (const [name, value] of Object.entries({
    getComputedStyle: () => ({ getPropertyValue: () => 'rgb(0,0,0)' }),
    document: { createElement: () => ({ getContext: () => ({ clearRect() {}, fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, getImageData: () => pixels }) }) },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => { if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
  const style: StyleSpecification = { version: 8, sources: {}, layers: [] };
  const images = new Set<string>();
  const map = {
    getSource: (id: string) => style.sources[id],
    addSource: (id: string, source: StyleSpecification['sources'][string]) => { style.sources[id] = source; },
    addLayer: (layer: StyleSpecification['layers'][number]) => style.layers.push(layer),
    hasImage: (id: string) => images.has(id), addImage: (id: string) => images.add(id),
  } as unknown as MlMap;
  addRouteLayers(map, {} as HTMLElement);
  assert.deepEqual(validateStyleMin(style).map((error) => error.message), []);
  const hit = style.layers.find((layer) => layer.id === ROUTE.HIT_LAYER);
  assert.ok(hit?.type === 'line');
  assert.ok(Number(hit.paint?.['line-width']) >= 28);
  const line = style.layers.find((layer) => layer.id === MAP.ROUTE_LINE_LAYER_ID);
  assert.ok(line?.type === 'line');
  assert.deepEqual(line.paint?.['line-dasharray'], [2, 2]);
  assert.ok(Number(line.paint?.['line-opacity']) < 1);
  assert.equal(createExpression(line.paint?.['line-color'], 'line-color').result, 'success');
  const arrows = style.layers.find((layer) => layer.id === ROUTE.ARROW_LAYER);
  assert.ok(arrows?.type === 'symbol');
  assert.equal(arrows.layout?.['symbol-placement'], 'line');
  assert.equal(arrows.layout?.['icon-keep-upright'], false);
  assert.equal(images.size, 6);
  addRouteLayers(map, {} as HTMLElement);
  assert.equal(style.layers.length, 4);
});

