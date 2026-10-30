import test from 'node:test';
import assert from 'node:assert/strict';
import { drawProgress, drawRouteFeatures } from './routeDraw.ts';
import { routeSegmentFeatures } from './routeSegments.ts';

test('tiến độ kẹp timestamp âm/quá hạn và giảm chuyển động', () => {
  assert.equal(drawProgress(-8, 850), 0);
  assert.equal(drawProgress(425, 850), .5);
  assert.equal(drawProgress(1000, 850), 1);
  assert.equal(drawProgress(0, 850, true), 1);
});

test('tuyến vẽ theo thứ tự đoạn, điểm cuối nội suy và dữ liệu gốc bất biến', () => {
  const markers = [{ id: 'a', lat: 12, lon: 108 }, { id: 'b', lat: 13, lon: 109 }, { id: 'c', lat: 14, lon: 110 }];
  const features = routeSegmentFeatures({ ids: ['a', 'b', 'c'], labels: [] }, markers);
  features[0]!.geometry.coordinates = [[108, 12], [109, 13]];
  features[1]!.geometry.coordinates = [[109, 13], [110, 14]];
  const before = JSON.stringify(features);
  assert.deepEqual(drawRouteFeatures(features, 0), []);
  const quarter = drawRouteFeatures(features, .25);
  assert.equal(quarter.length, 1);
  assert.deepEqual(quarter[0]!.geometry.coordinates.at(-1), [108.5, 12.5]);
  assert.deepEqual(drawRouteFeatures(features, .5), [features[0]]);
  assert.equal(drawRouteFeatures(features, .75).length, 2);
  assert.deepEqual(drawRouteFeatures(features, 1), features);
  assert.equal(JSON.stringify(features), before);
});
