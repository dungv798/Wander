import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';
import { addNativePinLayers, pinHitLayers } from './nativePinLayers.ts';
import { MAP } from './map.const.ts';

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
  for (const id of pinHitLayers().slice(1)) {
    const layer = style.layers.find((candidate) => candidate.id === id);
    assert.ok(layer?.type === 'circle');
    assert.equal(layer.paint?.['circle-radius'], 22);
  }
});
