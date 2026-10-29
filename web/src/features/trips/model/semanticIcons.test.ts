import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEM_KINDS } from './trip.const.ts';

test('thuê xe dùng chìa khóa trung tính, di chuyển giữ tuyến đường', () => {
  assert.equal(ITEM_KINDS.car_rental.icon, 'key');
  assert.equal(ITEM_KINDS.transport.icon, 'route');
});
