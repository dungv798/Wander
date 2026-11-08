import test from 'node:test';
import assert from 'node:assert/strict';
import { airKm, formatTravelDistance, formatTravelMinutes, formatTravelTime, minutesForKm, roundTravelMinutes, sumRoundedMinutes, travelEstimate } from './geo.ts';

test('chặng dưới 1 km không thành 0 km, mốc 1 km và thời gian giữ cách làm tròn', () => {
  for (const km of [0, 0.2, 0.99]) {
    assert.equal(formatTravelDistance(km), 'dưới 1 km');
    assert.equal(formatTravelTime(minutesForKm(km)), '15 phút');
  }
  assert.equal(formatTravelDistance(1), '1 km');
  assert.equal(formatTravelDistance(1.6), '2 km');
});

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

test('tổng thời gian đi bằng tổng các chặng đã hiển thị, không làm tròn lại từ tổng km', () => {
  // ba chặng ngắn: mỗi chặng hiển thị tối thiểu 15 phút ⇒ tổng phải là 45 phút, không phải 15
  const km = 1;
  const legs = [km, km, km].map(minutesForKm);
  assert.equal(roundTravelMinutes(legs[0]!), 15);
  assert.equal(sumRoundedMinutes(legs), 45);
  assert.equal(formatTravelMinutes(45), '45 phút');
  assert.equal(formatTravelMinutes(135), '2 giờ 15 phút');
  assert.equal(formatTravelMinutes(120), '2 giờ');
});

test('formatTravelTime dùng chung cách làm tròn với roundTravelMinutes', () => {
  for (const m of [3, 22, 40]) assert.equal(formatTravelTime(m), formatTravelMinutes(roundTravelMinutes(m)));
  assert.equal(roundTravelMinutes(100), 90);
  assert.equal(formatTravelTime(100), '1,5 giờ');
});
