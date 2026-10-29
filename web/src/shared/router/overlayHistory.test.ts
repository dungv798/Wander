import test from 'node:test';
import assert from 'node:assert/strict';
import { isOverlayEntry, withOverlay, withoutOverlay } from './overlayHistory.ts';
import { routeDepth, withRouteDepth } from './backNavigation.ts';

test('tờ phủ giữ lịch sử màn nền; sang tuyến khác gỡ dấu, không sửa state cũ', () => {
  const base = withRouteDepth({ other: 'kept' }, 1);
  const overlay = withOverlay(base, '#/deck/ha-giang');
  assert.equal(isOverlayEntry(overlay, '#/deck/ha-giang'), true);
  assert.equal(isOverlayEntry(overlay, '#/settings'), false);
  assert.equal(routeDepth(overlay), routeDepth(base));
  assert.deepEqual(withoutOverlay(overlay), base);
  assert.deepEqual(base, { other: 'kept', wanderRouteDepth: 1 });
  for (const state of [null, undefined, {}, 'invalid']) assert.equal(isOverlayEntry(state, '#/'), false);
});
