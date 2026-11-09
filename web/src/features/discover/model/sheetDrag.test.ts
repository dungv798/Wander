import test from 'node:test';
import assert from 'node:assert/strict';
import { clampDragOffset, decideSheetMode, isTap } from './sheetDrag.ts';

const TRAVEL = 400;

test('mở + kéo xuống đủ xa (≥ 25% quãng đường) thì thu lại; kéo ngắn và chậm thì giữ nguyên', () => {
  assert.equal(decideSheetMode('open', 120, 600, TRAVEL), 'peek');
  assert.equal(decideSheetMode('open', 60, 600, TRAVEL), 'open');
});

test('hất nhanh dù ngắn cũng chuyển trạng thái', () => {
  assert.equal(decideSheetMode('open', 60, 80, TRAVEL), 'peek');
  assert.equal(decideSheetMode('peek', -60, 80, TRAVEL), 'open');
});

test('thu + kéo lên đủ xa thì mở; kéo ngược chiều (kéo xuống khi đang thu, kéo lên khi đang mở) không đổi gì', () => {
  assert.equal(decideSheetMode('peek', -150, 700, TRAVEL), 'open');
  assert.equal(decideSheetMode('peek', 300, 200, TRAVEL), 'peek');
  assert.equal(decideSheetMode('open', -300, 200, TRAVEL), 'open');
});

test('độ dịch hiển thị bị chặn trong [0, travel] khi mở và [-travel, 0] khi thu', () => {
  assert.equal(clampDragOffset('open', -50, TRAVEL), 0);
  assert.equal(clampDragOffset('open', 999, TRAVEL), TRAVEL);
  assert.equal(clampDragOffset('open', 70, TRAVEL), 70);
  assert.equal(clampDragOffset('peek', 50, TRAVEL), 0);
  assert.equal(clampDragOffset('peek', -999, TRAVEL), -TRAVEL);
});

test('dịch chuyển nhỏ là bấm, lớn hơn là kéo', () => {
  assert.equal(isTap(2, 3), true);
  assert.equal(isTap(0, 30), false);
});
