import test from 'node:test';
import assert from 'node:assert/strict';
import type { MapGeoJSONFeature } from 'maplibre-gl';
import { markerAccessibleName, markerFeatures, markerSnapshot, markerThumbnail, renderedImageCount, thumbnailCrop } from './nativeMarkers.ts';
import { MAP } from './map.const.ts';
import type { MapMarker } from './map.types.ts';

const markers: MapMarker[] = [
  { id: 'lake', lat: 11.94, lon: 108.44, label: 'Hồ Xuân Hương', num: 2, thumb: ' /catalog/lake.jpg ', muted: true },
  { id: 'hub', lat: 12, lon: 109, kind: 'hub' },
];

test('GeoJSON giữ ID, kinh/vĩ độ, số và trạng thái; hub không vào cụm', () => {
  const clustered = markerFeatures(markers, 'browse', true);
  assert.deepEqual(clustered.features.map((feature) => feature.id), ['lake']);
  assert.deepEqual(clustered.features[0]?.geometry.coordinates, [108.44, 11.94]);
  assert.deepEqual(clustered.features[0]?.properties, { id: 'lake', label: 'Hồ Xuân Hương', num: '2', muted: true, hub: false, image: '/catalog/lake.jpg' });
  assert.deepEqual(markerFeatures(markers, 'browse', false).features.map((feature) => feature.id), ['hub']);
  assert.equal(markerFeatures(markers, 'route', true).features.length, 0);
  assert.equal(markerFeatures(markers, 'browse', false).features[0]?.properties?.['image'], MAP.EMPTY_IMAGE);
  assert.deepEqual(markerFeatures(markers, 'route', false).features.map((feature) => feature.id), ['lake', 'hub']);
  assert.deepEqual(markerFeatures([], 'browse', true).features, []);
});

test('đếm ảnh resolve từ photo layer, không nhầm sprite rỗng hoặc URL chưa đăng ký là ảnh đang vẽ', () => {
  const photo = { properties: { id: 'lake', image: '/lake.jpg' }, layer: { type: 'symbol', layout: { 'icon-image': { name: '/lake.jpg', available: true } } } };
  const fallback = { ...photo, layer: { type: 'symbol', layout: { 'icon-image': { name: MAP.EMPTY_IMAGE, available: true } } } };
  const features = [photo, photo, fallback] as unknown as Pick<MapGeoJSONFeature, 'properties' | 'layer'>[];
  assert.equal(renderedImageCount(features, (id) => id === '/lake.jpg'), 1);
  assert.equal(renderedImageCount([features[2]!], () => true), 0);
  assert.equal(renderedImageCount(features, () => false), 0);
});

test('thumbnail lấy đúng ảnh catalog; thiếu ảnh không sáng tác URL và tên truy cập giữ số', () => {
  assert.equal(markerThumbnail(markers[0]!), '/catalog/lake.jpg');
  assert.equal(markerThumbnail(markers[1]!), '');
  assert.equal(markerThumbnail({ ...markers[0]!, thumb: '  ' }), '');
  assert.equal(markerAccessibleName(markers[0]!), '2. Hồ Xuân Hương');
  assert.equal(markerAccessibleName(markers[1]!), 'hub');
});

test('data-* chỉ đếm feature đang vẽ, loại trùng tile, tách namespace cluster và pin', () => {
  const pin: Pick<MapGeoJSONFeature, 'geometry' | 'properties'> = { geometry: { type: 'Point', coordinates: [108, 12] }, properties: { id: '7' } };
  const cluster: Pick<MapGeoJSONFeature, 'geometry' | 'properties'> = { geometry: { type: 'Point', coordinates: [109, 13] }, properties: { cluster: true, cluster_id: 7 } };
  const snapshot = markerSnapshot([pin, pin, cluster], ([x, y]) => ({ x: x + 0.1234, y }), '7');
  assert.equal(snapshot.pins, '1');
  assert.equal(snapshot.clusters, '1');
  assert.equal(snapshot.selected, '7');
  assert.deepEqual(JSON.parse(snapshot.features), [
    { id: '7', cluster: false, x: 108.1, y: 12 }, { id: '7', cluster: true, x: 109.1, y: 13 },
  ]);
  assert.deepEqual(markerSnapshot([], () => ({ x: 0, y: 0 }), null), { pins: '0', clusters: '0', selected: '', features: '[]' });
});

test('thumbnail cắt giữa ảnh ngang/dọc/vuông về đúng 96×96, không méo ảnh', () => {
  assert.deepEqual(thumbnailCrop(192, 96), [48, 0, 96, 96, 0, 0, 96, 96]);
  assert.deepEqual(thumbnailCrop(96, 192), [0, 48, 96, 96, 0, 0, 96, 96]);
  assert.deepEqual(thumbnailCrop(48, 48), [0, 0, 48, 48, 0, 0, 96, 96]);
});
