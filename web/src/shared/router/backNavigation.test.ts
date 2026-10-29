import test from 'node:test';
import assert from 'node:assert/strict';
import { parentRoute, routeDepth, withRouteDepth } from './backNavigation.ts';
import { VIEW } from '../const/routes.const.ts';

test('chỉ lịch sử đã gắn dấu mới cho phép quay lui, giữ state khi đổi tab hoặc tải lại', () => {
  for (const invalid of [null, {}, { wanderRouteDepth: -1 }, { wanderRouteDepth: '2' }, { wanderRouteDepth: Infinity }]) assert.equal(routeDepth(invalid), 0);
  const previous = withRouteDepth({ other: 'preserved' }, 1);
  const next = withRouteDepth(previous, routeDepth(previous) + 1);
  assert.equal(routeDepth(next), 2);
  assert.equal(next.other, 'preserved');
  assert.equal(routeDepth(JSON.parse(JSON.stringify(next))), 2);
});

test('liên kết mở trực tiếp luôn có màn cha: chuyến → danh sách, Hôm nay/xuất → chuyến', () => {
  assert.deepEqual(parentRoute(VIEW.TRIP, 'trip-a'), { view: VIEW.TRIPS });
  assert.deepEqual(parentRoute(VIEW.TODAY, null), { view: VIEW.TRIPS });
  for (const view of [VIEW.EXPORT, VIEW.TODAY]) assert.deepEqual(parentRoute(view, 'trip-a'), { view: VIEW.TRIP, id: 'trip-a' });
  for (const view of [VIEW.DECK, VIEW.DEST, VIEW.DESTINATIONS, VIEW.ONBOARD, VIEW.JOIN, VIEW.EXPIRED, VIEW.SETTINGS, VIEW.SECURITY, VIEW.RECOVER]) assert.deepEqual(parentRoute(view, null), { view: VIEW.EXPLORE });
});
