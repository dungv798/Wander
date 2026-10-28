import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterPins, pinBox, placeLabels } from './mapGeometry.ts';

const SIZE = { w: 400, h: 600 };

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

test('nhãn ra ngoài khung thì bị ẩn', () => {
  const { placed } = placeLabels([{ id: 'x', at: [2, 2] as const, w: 500, h: 20 }], [], SIZE);
  assert.equal(placed.size, 0);
});
