import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRouteKm, makeRouteSegment, nearestMapObject, routeDayToken, routeSegmentFeatures, routeSegmentsForDays } from './routeSegments.ts';
const markers = [{ id: 'a', label: 'Hồ', lat: 12, lon: 108 }, { id: 'b', label: 'Đồi', lat: 12.1, lon: 108.2 }, { id: 'c', lat: 13, lon: 109 }];

test('feature mang mã, thứ tự, hai ghim, ngày và km ước tính hữu hạn; ID giữ nguyên khi thay thứ tự', () => {
  const segment = makeRouteSegment(markers[0]!, markers[1]!, 2, 1);
  const [feature] = routeSegmentFeatures({ ids: ['a', 'b'], labels: [], segments: [segment] }, markers);
  assert.equal(feature?.id, segment.id);
  assert.deepEqual(feature?.properties, segment);
  assert.ok(segment.km > 30 && segment.km < 40);
  assert.deepEqual(feature?.geometry.coordinates[0], [108, 12]);
  assert.deepEqual(feature?.geometry.coordinates.at(-1), [108.2, 12.1]);
  assert.equal(makeRouteSegment(markers[0]!, markers[1]!, 2, 3).id, segment.id);
});

test('ghim thiếu ở giữa không bị nối tắt; nhiều ngày không tự nối xuyên ngày', () => {
  assert.deepEqual(routeSegmentFeatures({ ids: ['a', 'missing', 'c'], labels: [] }, markers), []);
  const features = routeSegmentFeatures({ ids: ['a', 'b', 'c'], labels: [], segments: [makeRouteSegment(markers[0]!, markers[1]!, 0, 1)] }, markers);
  assert.equal(features.length, 1);
  assert.equal(features[0]?.properties.to, 'b');
  assert.equal(routeSegmentFeatures(null, markers).length, 0);
});

test('ghim ưu tiên hơn đoạn ngay cả khi đoạn gần hơn; đoạn chồng nhau chọn hình học gần nhất', () => {
  const hits = [
    { id: 'far', kind: 'segment' as const, line: [[0, 5], [10, 5]] as const },
    { id: 'near', kind: 'segment' as const, line: [[0, 1], [10, 1]] as const },
  ];
  assert.equal(nearestMapObject(hits, [3, 0]), 'near');
  assert.equal(nearestMapObject([...hits, { id: 'pin', kind: 'pin', line: [[8, 8]] }], [3, 0]), 'pin');
  assert.equal(nearestMapObject([...hits, { id: 'cluster', kind: 'cluster', line: [[8, 8]] }], [3, 0]), 'cluster');
  assert.equal(nearestMapObject([], [0, 0]), null);
  assert.equal(nearestMapObject([{ id: 'same', kind: 'segment', line: [[0, 0], [0, 0]] }], [0, 0]), 'same');
});

test('nhãn luôn nêu ước tính và màu xoay đúng sáu ngày', () => {
  assert.equal(formatRouteKm(0.2), 'còn ~1 km, ước tính');
  assert.equal(formatRouteKm(12.6), 'còn ~13 km, ước tính');
  assert.equal(new Set(Array.from({ length: 6 }, (_, i) => routeDayToken(i))).size, 6);
  assert.equal(routeDayToken(7), routeDayToken(1));
});

test('nhóm ngày giữ thứ tự, không nối qua điểm thiếu hoặc xuyên ngày', () => {
  const parts = routeSegmentsForDays([['a', 'missing', 'b', 'c'], ['b', 'a']], markers);
  assert.deepEqual(parts.map(({ from, to, day, order }) => ({ from, to, day, order })), [{ from: 'b', to: 'c', day: 0, order: 3 }, { from: 'b', to: 'a', day: 1, order: 1 }]);
});
