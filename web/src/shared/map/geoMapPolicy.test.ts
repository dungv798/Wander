import test from 'node:test';
import assert from 'node:assert/strict';
import { needsInsetRefit, fitMaxZoom, isBasemapError } from './geoMapPolicy.ts';
import { MAP } from './map.const.ts';
import { clusterPins } from './mapGeometry.ts';

const BEFORE = { top: 0, right: 0, bottom: 100, left: 0 };
const AFTER = { ...BEFORE, bottom: 400 };

test('đổi nấc tờ dưới: giữ camera đã kéo nếu ghim còn thấy, vừa lại nếu bị che', () => {
  assert.equal(needsInsetRefit(BEFORE, AFTER, true, true), false);
  assert.equal(needsInsetRefit(BEFORE, AFTER, true, false), true);
  assert.equal(needsInsetRefit(BEFORE, AFTER, false, true), true);
  assert.equal(needsInsetRefit(BEFORE, { ...BEFORE }, false, false), false);
});

test('vừa khung thường giữ zoom 14; cụm được lên 17 và không vượt giới hạn', () => {
  assert.equal(fitMaxZoom({}), MAP.GL_FIT_MAX_ZOOM);
  assert.equal(fitMaxZoom({ maxZoom: MAP.GL_MAX_ZOOM }), MAP.GL_MAX_ZOOM);
  assert.equal(fitMaxZoom({ maxZoom: 99 }), MAP.GL_MAX_ZOOM);
  assert.equal(fitMaxZoom({ maxZoom: -1 }), MAP.GL_MIN_ZOOM);
  const pins = [
    { id: 'a', p: [108, 12] as const, s: [0, 0] as const },
    { id: 'b', p: [108.001, 12] as const, s: [20, 0] as const },
  ];
  assert.equal(clusterPins(pins).length, 1);
  const scale = 2 ** (fitMaxZoom({ maxZoom: MAP.GL_MAX_ZOOM }) - MAP.GL_FIT_MAX_ZOOM);
  assert.equal(clusterPins(pins.map((p) => ({ ...p, s: [p.s[0] * scale, p.s[1] * scale] }))).length, 0);
});

test('phân loại lỗi nguồn/ô nền, bỏ qua lỗi tuyến và lỗi khác', () => {
  assert.equal(isBasemapError({ sourceId: 'openmaptiles', error: new Error('HTTP 503') }), true);
  assert.equal(isBasemapError({ tile: {}, error: new Error('HTTP 404') }), true);
  assert.equal(isBasemapError({ source: { type: 'vector' } }), true);
  assert.equal(isBasemapError({ sourceId: MAP.ROUTE_SOURCE_ID, tile: {} }), false);
  assert.equal(isBasemapError({ error: new Error('shader') }), false);
});
