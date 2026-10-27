import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainData } from './TerrainData.ts';
import { arcSegments, clampCamera, clusterPins, fitCamera, mapEase, pinBox, placeLabels, toScreen, townIsCrowded, zoomCamera } from './mapGeometry.ts';

const SIZE = { w: 400, h: 600 };
const NO_INSET = { top: 0, right: 0, bottom: 0, left: 0 };

test('ease đi từ 0 đến 1 và đơn điệu', () => {
  assert.equal(mapEase(0), 0);
  assert.equal(mapEase(1), 1);
  assert.ok(mapEase(0.25) < mapEase(0.5) && mapEase(0.5) < mapEase(0.75));
});

test('clamp giữ camera trong vùng dữ liệu và khoảng zoom', () => {
  const c = clampCamera({ cx: -50, cy: 99999, s: 99 }, { w: 3072, h: 3072 }, 0.1);
  assert.equal(c.cx, 0);
  assert.equal(c.cy, 3072);
  assert.equal(c.s, 1.8);
});

test('chiếu Web Mercator: Hà Giang nằm trong ảnh nền 3072 px', () => {
  const meta = { dest: 'ha-giang', zoom: 12, width: 3072, height: 3072, origin: [828928, 453888] as const, credit: '' };
  const [x, y] = TerrainData.project(meta, 22.8233, 104.9836);
  assert.ok(x > 0 && x < 3072 && y > 0 && y < 3072);
  const [x2, y2] = TerrainData.project(meta, 23.36794444, 105.31563333);
  assert.ok(y2 < y, 'Lũng Cú (vĩ độ lớn hơn) nằm phía trên TP Hà Giang');
  assert.ok(x2 > x, 'Lũng Cú (kinh độ lớn hơn) nằm bên phải');
});

test('vừa khung các điểm: tâm ở giữa và không phóng quá mức', () => {
  const cam = fitCamera([[1000, 1000], [1200, 1300]], SIZE, NO_INSET, 0.1);
  assert.ok(cam);
  assert.equal(cam.cx, 1100);
  assert.equal(cam.cy, 1150);
  assert.ok(cam.s <= 1.8 * 0.55 + 1e-9);
  assert.equal(fitCamera([], SIZE, NO_INSET, 0.1), null);
});

test('phóng quanh điểm giữa màn hình không đổi tâm; quanh góc thì dời tâm', () => {
  const cam = { cx: 500, cy: 500, s: 0.5 };
  const mid = zoomCamera(cam, SIZE, 2, 200, 300, 0.1);
  assert.equal(mid.cx, 500);
  assert.equal(mid.s, 1);
  assert.notEqual(zoomCamera(cam, SIZE, 2, 0, 0, 0.1).cx, 500);
});

test('toScreen đưa tâm camera về giữa khung', () => {
  assert.deepEqual(toScreen({ cx: 10, cy: 20, s: 2 }, SIZE, [10, 20]), [200, 300]);
});

test('cung tuyến: n điểm → n-1 đoạn, đường liền mạch bắt đầu bằng M', () => {
  const { segs, all } = arcSegments([[0, 0], [100, 0], [100, 100]]);
  assert.equal(segs.length, 2);
  assert.equal(segs[1]?.index, 2);
  assert.ok(all.startsWith('M0 0'));
  assert.equal(arcSegments([]).segs.length, 0);
});

test('gộp cụm: hai ghim sát nhau thành một nhóm, ghim xa thì không', () => {
  const pins = [
    { id: 'a', p: [0, 0] as const, s: [100, 100] as const },
    { id: 'b', p: [10, 10] as const, s: [110, 105] as const },
    { id: 'c', p: [500, 500] as const, s: [300, 400] as const },
  ];
  const groups = clusterPins(pins);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0]?.ids, ['a', 'b']);
  assert.deepEqual(groups[0]?.p, [5, 5]);
});

test('đặt nhãn không chồng: nhãn thứ hai tránh chỗ nhãn thứ nhất', () => {
  const reqs = [
    { id: 'a', at: [100, 100] as const, w: 80, h: 20 },
    { id: 'b', at: [100, 105] as const, w: 80, h: 20 },
  ];
  const { placed, boxes } = placeLabels(reqs, [pinBox([100, 100], 20), pinBox([100, 105], 20)], SIZE);
  assert.ok(placed.has('a'));
  if (placed.has('b')) assert.notDeepEqual(placed.get('a'), placed.get('b'));
  assert.ok(boxes.length >= 1);
});

test('nhãn ra ngoài khung thì bị ẩn; thị trấn gần ghim thì bị ẩn', () => {
  const { placed } = placeLabels([{ id: 'x', at: [2, 2] as const, w: 500, h: 20 }], [], SIZE);
  assert.equal(placed.size, 0);
  assert.equal(townIsCrowded([100, 100], [[90, 95, 20, 20]]), true);
  assert.equal(townIsCrowded([300, 300], [[90, 95, 20, 20]]), false);
});
