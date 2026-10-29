import test from 'node:test';
import assert from 'node:assert/strict';
import { createExpression, validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';
import { addNativePinLayers, pinHitLayers } from './nativePinLayers.ts';
import { MAP } from './map.const.ts';
import { markerFeatures } from './nativeMarkers.ts';

test('cấu hình lớp native hợp lệ với style-spec MapLibre đang cài, có hit 44 px và hub ngoài cụm', (t) => {
  for (const [name, value] of Object.entries({
    getComputedStyle: () => ({ getPropertyValue: () => 'rgb(0,0,0)' }),
    document: { createElement: () => ({ getContext: () => ({ clearRect() {}, fillRect() {}, getImageData: () => ({ data: [0, 0, 0, 255] }) }) }) },
  })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  const style: StyleSpecification = { version: 8, sources: {}, layers: [], glyphs: 'https://example.test/{fontstack}/{range}.pbf' };
  const images: string[] = [];
  const map = {
    addSource(id: string, source: StyleSpecification['sources'][string]) { style.sources[id] = source; },
    addLayer(layer: StyleSpecification['layers'][number]) { style.layers.push(layer); },
    hasImage() { return false; },
    addImage(id: string) { images.push(id); },
  } as unknown as MlMap;
  addNativePinLayers(map, {} as HTMLElement);
  assert.deepEqual(validateStyleMin(style).map((error) => error.message), []);
  assert.deepEqual(images, [MAP.EMPTY_IMAGE]);
  assert.ok(style.sources[MAP.PIN_SOURCES[0]]?.type === 'geojson');
  const clustered = style.sources[MAP.PIN_SOURCES[0]];
  const plain = style.sources[MAP.PIN_SOURCES[1]];
  assert.ok(clustered?.type === 'geojson' && plain?.type === 'geojson');
  assert.equal(clustered.cluster, true);
  assert.equal(clustered.clusterMaxZoom, 16, 'cụm tách hết ở zoom tối đa 17');
  assert.equal(plain.cluster, false);
  const photo = style.layers.find((layer) => layer.id === `${MAP.PIN_LAYER_PREFIX}0-photo`);
  assert.ok(photo?.type === 'symbol');
  assert.ok(style.layers.indexOf(photo) > style.layers.findIndex((layer) => layer.id === `${MAP.PIN_LAYER_PREFIX}0-circle`), 'ảnh nằm trên nền tròn');
  assert.equal(photo.layout?.['icon-allow-overlap'], true);
  const expression = createExpression(photo.layout?.['icon-image'], 'icon-image');
  assert.equal(expression.result, 'success');
  if (expression.result !== 'success') return;
  for (const url of ['/catalog/photos/lang-biang-1.jpg', '/catalog/photos/thac-pongour.jpg?size=96&crop=1']) {
    const feature = markerFeatures([{ id: 'pin', lat: 12, lon: 108, thumb: url }], 'browse', true).features[0]!;
    const input = { type: 'Point' as const, properties: feature.properties! };
    const waiting = expression.value.evaluate({ zoom: 12 }, input, {}, undefined, [MAP.EMPTY_IMAGE]);
    assert.equal(waiting.name, url, 'ảnh chưa đến vẫn phải đăng ký phụ thuộc đúng ID, không chốt sprite rỗng');
    assert.equal(waiting.available, false);
    const loaded = expression.value.evaluate({ zoom: 12 }, input, {}, undefined, [MAP.EMPTY_IMAGE, url]);
    assert.equal(loaded.name, url);
    assert.equal(loaded.available, true);
  }
  for (const id of pinHitLayers().slice(1)) {
    const layer = style.layers.find((candidate) => candidate.id === id);
    assert.ok(layer?.type === 'circle');
    assert.equal(layer.paint?.['circle-radius'], 22);
  }
});
