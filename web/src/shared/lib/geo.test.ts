import test from 'node:test';
import assert from 'node:assert/strict';
import { airKm, formatTravelTime, travelEstimate } from './geo.ts';

test('khoảng cách chim bay TP Hà Giang → Đồng Văn chim bay khoảng 62 km', () => {
  const hg = { lat: 22.8233, lon: 104.9836 };
  const dv = { lat: 23.28177778, lon: 105.35989444 };
  assert.ok(Math.abs(airKm(hg, dv) - 62) < 5);
  assert.equal(travelEstimate(hg, hg).km, 1);
});

test('thời gian đi dễ đọc', () => {
  assert.equal(formatTravelTime(5), '15 phút');
  assert.equal(formatTravelTime(40), '45 phút');
  assert.equal(formatTravelTime(120), '2 giờ');
  assert.equal(formatTravelTime(150), '2,5 giờ');
});
