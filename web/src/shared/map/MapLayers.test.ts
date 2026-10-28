import test from 'node:test';
import assert from 'node:assert/strict';
import { MapLayers } from './MapLayers.ts';
import type { Pt } from './map.types.ts';

test('place dời nhãn theo neo mới khi kéo/zoom và giữ độ lệch đã tránh chồng', () => {
  const label = { style: { transform: '' } };
  const layers = Object.create(MapLayers.prototype) as MapLayers;
  Object.assign(layers, {
    markerEls: new Map(), clusters: [], segMids: [],
    pinLabels: [{ el: label, p: [108, 12], offset: [-80, 22] }],
  });
  layers.place((): Pt => [200, 300], []);
  assert.equal(label.style.transform, 'translate3d(120.0px, 322.0px, 0)');
  layers.place((): Pt => [400, 600], []);
  assert.equal(label.style.transform, 'translate3d(320.0px, 622.0px, 0)');
});
