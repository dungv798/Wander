import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLAPSE } from './scrollCollapse.const.ts';
import { nextCollapsed } from './scrollCollapse.ts';

const ROOMY = COLLAPSE.MIN_SCROLLABLE_PX + 100;

test('chưa cuộn thì giữ nguyên trạng thái mở; cuộn quá ngưỡng và còn đủ chỗ cuộn thì thu gọn', () => {
  assert.equal(nextCollapsed(false, 0, ROOMY), false);
  assert.equal(nextCollapsed(false, COLLAPSE.AT_PX, ROOMY), false, 'đúng ngưỡng chưa đủ');
  assert.equal(nextCollapsed(false, COLLAPSE.AT_PX + 1, ROOMY), true);
});

test('nội dung ngắn (còn ít chỗ cuộn) không thu gọn, để khỏi lặp thu/mở khi vùng cuộn nở ra', () => {
  assert.equal(nextCollapsed(false, COLLAPSE.AT_PX + 50, COLLAPSE.MIN_SCROLLABLE_PX - 1), false);
});

test('đã thu gọn thì chỉ mở lại khi cuộn gần hẳn về đầu (độ trễ giữa hai ngưỡng)', () => {
  assert.equal(nextCollapsed(true, COLLAPSE.AT_PX, ROOMY), true);
  assert.equal(nextCollapsed(true, COLLAPSE.EXPAND_AT_PX + 1, ROOMY), true);
  assert.equal(nextCollapsed(true, COLLAPSE.EXPAND_AT_PX, ROOMY), false);
  assert.equal(nextCollapsed(true, 0, 0), false, 'về đầu thì luôn mở, kể cả khi nội dung đã ngắn lại');
});

test('ngưỡng mở lại thấp hơn ngưỡng thu gọn (nếu không sẽ nhấp nháy)', () => {
  assert.ok(COLLAPSE.EXPAND_AT_PX < COLLAPSE.AT_PX);
});
