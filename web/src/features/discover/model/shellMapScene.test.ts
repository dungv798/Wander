import assert from 'node:assert/strict';
import { test } from 'node:test';
import { VIEW } from '../../../shared/const/routes.const.ts';
import type { DestinationDetail, DestinationSummary, PlaceView } from './Catalog.types.ts';
import { shellMapScene } from './shellMapScene.ts';
import type { ShellMapInput, ShellTripRef } from './shellMapScene.ts';

const summary = (id: string, lat: number | null, lon: number | null): DestinationSummary => ({
  id, name: `Điểm ${id}`, region: 'Vùng', tagline: '', placeCount: 3, coverUrl: `/catalog/photos/${id}.jpg`, bestMonths: [], previews: [], lat, lon,
}) as DestinationSummary;

const place = (id: string, lat: number | null, lon: number | null): PlaceView => ({ id, name: `Nơi ${id}`, lat, lon, photos: [] }) as unknown as PlaceView;

const detail = (places: PlaceView[]): DestinationDetail => ({ id: 'a', name: 'A', places, guide: [], references: [], moments: [] }) as unknown as DestinationDetail;

const SUMMARIES = [summary('a', 10, 100), summary('b', 20, 105), summary('c', null, null)];

/** Đầu vào mặc định; mỗi ca chỉ ghi đè phần nó kiểm. */
const input = (over: Partial<ShellMapInput>): ShellMapInput => ({ view: VIEW.EXPLORE, selectedId: null, destId: 'a', summaries: SUMMARIES, detail: null, pickedIds: new Set(), trips: [], ...over });

test('Khám phá chưa chọn điểm đến: cảnh tổng quan, ghim điểm đến có tọa độ, không ghim nơi thiếu tọa độ', () => {
  const scene = shellMapScene(input({}));
  assert.equal(scene.kind, 'overview');
  assert.deepEqual(scene.markers.map((m) => m.id), ['a', 'b']);
  assert.equal(scene.markers[0]?.thumb, '/catalog/photos/a.jpg');
  assert.equal(scene.fit?.ids, null);
});

test('Khám phá vẫn mở toàn cảnh sau khi đã chọn điểm đến; không mắc kẹt ở cảnh điểm đến cũ', () => {
  const scene = shellMapScene(input({ selectedId: 'a', detail: detail([place('p1', 1, 2), place('p2', null, null)]) }));
  assert.equal(scene.kind, 'overview');
  assert.deepEqual(scene.markers.map((m) => m.id), ['a', 'b']);
});

test('Đã chọn: ghim đánh số chỉ cho nơi đã chọn; chưa chọn nơi nào thì rơi về cảnh điểm đến', () => {
  const places = [place('p1', 1, 2), place('p2', 3, 4), place('p3', 5, 6)];
  const picked = shellMapScene(input({ view: VIEW.PICKED, selectedId: 'a', detail: detail(places), pickedIds: new Set(['p3', 'p1']) }));
  assert.equal(picked.kind, 'picked');
  assert.deepEqual(picked.markers.map((m) => [m.id, m.num]), [['p1', 1], ['p3', 2]]);
  const none = shellMapScene(input({ view: VIEW.PICKED, selectedId: 'a', detail: detail(places) }));
  assert.equal(none.kind, 'destination');
  assert.equal(none.markers.length, 3);
});

test('Màn có bản đồ riêng hoặc không dùng bản đồ (chuyến chi tiết, hôm nay, cài đặt…) thì cảnh ẩn', () => {
  for (const view of [VIEW.TRIP, VIEW.TODAY, VIEW.SETTINGS, VIEW.ONBOARD, VIEW.SECURITY]) {
    const scene = shellMapScene(input({ view, selectedId: 'a', detail: detail([]) }));
    assert.equal(scene.kind, 'hidden', view);
  }
});

test('Bộ thẻ quẹt dùng bản đồ điểm đến làm nền hiển thị, không dựng lại nền ảnh mờ cũ', () => {
  assert.equal(shellMapScene(input({ view: VIEW.DECK, detail: detail([place('p1', 1, 2)]) })).kind, 'destination');
});

test('Chưa tải xong chi tiết điểm đến: vẫn có cảnh điểm đến nhưng chưa có ghim (không bịa ghim)', () => {
  const scene = shellMapScene(input({ view: VIEW.DEST, selectedId: 'a' }));
  assert.equal(scene.kind, 'destination');
  assert.deepEqual(scene.markers, []);
});

test('mỗi lần dựng cảnh trả yêu cầu vừa khung MỚI (đối tượng khác nhau) để TerrainMapView bay camera lại', () => {
  const first = shellMapScene(input({}));
  const second = shellMapScene(input({}));
  assert.notEqual(first.fit, second.fit);
  assert.deepEqual(first.fit, second.fit);
  assert.equal(first.key, second.key);
});

test('Khóa cảnh đổi khi đổi điểm đến hoặc tập ghim, để camera vừa khung lại', () => {
  const a = shellMapScene(input({ view: VIEW.DEST, selectedId: 'a', detail: detail([place('p1', 1, 2)]) }));
  const b = shellMapScene(input({ view: VIEW.DEST, selectedId: 'a', detail: detail([place('p1', 1, 2), place('p2', 3, 4)]) }));
  const other = shellMapScene(input({ view: VIEW.DEST, selectedId: 'b', destId: 'b' }));
  assert.notEqual(a.key, other.key);
  assert.notEqual(a.key, b.key, 'đổi tập ghim thì phải vừa khung lại');
});

test('Chuyến đi: mỗi chuyến một ghim ở điểm đến của nó, KHÔNG dùng điểm đến mặc định/đang chọn', () => {
  const trips: ShellTripRef[] = [
    { id: 't1', name: 'Chuyến B', destinationId: 'b' },
    { id: 't2', name: 'Chuyến không tọa độ', destinationId: 'c' },
    { id: 't3', name: 'Chuyến lạ', destinationId: 'zzz' },
  ];
  const scene = shellMapScene(input({ view: VIEW.TRIPS, selectedId: 'a', destId: 'a', detail: detail([place('p1', 1, 2)]), trips }));
  assert.equal(scene.kind, 'trips');
  assert.deepEqual(scene.markers.map((m) => [m.id, m.label]), [['t1', 'Chuyến B']]);
  assert.equal(scene.markers[0]?.lat, 20);
});

test('Chuyến đi chưa có chuyến nào có tọa độ: rơi về cảnh cả nước thay vì bản đồ trống', () => {
  const none = shellMapScene(input({ view: VIEW.TRIPS }));
  assert.equal(none.kind, 'overview');
  const noCoords = shellMapScene(input({ view: VIEW.TRIPS, trips: [{ id: 't', name: 'x', destinationId: 'c' }] }));
  assert.equal(noCoords.kind, 'overview');
});
