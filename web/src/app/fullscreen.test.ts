import test from 'node:test';
import assert from 'node:assert/strict';
import { isToolbarCollapsed } from './fullscreen.ts';
import { FULLSCREEN } from '../shared/const/fullscreen.const.ts';

test('đã coi là thu thanh khi trang cuộn tới ngưỡng, chưa thì chưa', () => {
  assert.equal(isToolbarCollapsed(0), false);
  assert.equal(isToolbarCollapsed(FULLSCREEN.COLLAPSED_SCROLL_PX - 1), false);
  assert.equal(isToolbarCollapsed(FULLSCREEN.COLLAPSED_SCROLL_PX), true);
  assert.equal(isToolbarCollapsed(FULLSCREEN.SCROLL_RANGE_PX), true);
});
