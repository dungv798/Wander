import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetStatus, costSummaryText, dayItems, roadKm, roadMinutes, summarizeCosts, tripDays, unassignedItems } from './tripMath.ts';
import type { TripItem } from './trip.types.ts';

/** Creates a sample item, overriding the fields to try. */
function item(over: Partial<TripItem>): TripItem {
  return { id: 'x', placeId: null, type: 'food', title: 't', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: null, done: false, addedBy: null, doneBy: [], ...over };
}

test('ngày của chuyến gồm hai đầu', () => {
  assert.deepEqual(tripDays({ startDate: '2026-10-31', endDate: '2026-11-02' }), ['2026-10-31', '2026-11-01', '2026-11-02']);
});

test('chi phí theo D17/D18: trống = chưa biết, 0 = biết bằng không, "đã bao gồm" không cộng', () => {
  const items = [
    item({ id: 'a', day: 'd1', costK: 100 }),
    item({ id: 'b', day: 'd1', costK: 0 }),
    item({ id: 'c', day: 'd1', costK: null }),
    item({ id: 'd', day: 'd2', costK: 500, included: true, referenceK: 25 }),
    item({ id: 'e', type: 'rest', costK: null }),
    item({ id: 'f', type: 'lodging', costK: 450, booking: 'booked', day: 'd2' }),
  ];
  const s = summarizeCosts({ items });
  assert.equal(s.totalK, 550);
  assert.equal(s.unknownCount, 1);
  assert.equal(s.includedCount, 1);
  assert.equal(s.bookable, 5, 'Nghỉ không đặt chỗ được');
  assert.equal(s.booked, 1);
  assert.equal(s.byKind.lodging, 450);
  assert.equal(s.byDayK['d1'], 100);
  assert.equal(s.unknownByDay['d1'], 1);
});

test('mục Nghỉ/Việc cần làm không bao giờ tính vào chưa biết giá', () => {
  const s = summarizeCosts({ items: [item({ type: 'task' }), item({ type: 'rest' })] });
  assert.equal(s.unknownCount, 0);
  assert.equal(s.bookable, 0);
});

test('ngân sách: còn lại, vượt, phần trăm kẹp 100', () => {
  assert.equal(budgetStatus(null, 10), null);
  assert.deepEqual(budgetStatus(1000, 250), { budgetK: 1000, leftK: 750, over: false, pct: 25 });
  assert.deepEqual(budgetStatus(1000, 1500), { budgetK: 1000, leftK: -500, over: true, pct: 100 });
  assert.equal(budgetStatus(0, 0)?.pct, 100);
});

test('mục trong ngày theo position, chưa có position xếp cuối theo thứ tự thêm', () => {
  const items = [item({ id: 'a', day: 'd', position: null }), item({ id: 'b', day: 'd', position: 1 }), item({ id: 'c', day: 'd', position: 0 }), item({ id: 'z', day: 'other' })];
  assert.deepEqual(dayItems({ items }, 'd').map((i) => i.id), ['c', 'b', 'a']);
  assert.deepEqual(unassignedItems({ items: [item({ id: 'u' }), item({ id: 'v', day: 'd' })] }).map((i) => i.id), ['u']);
});

test('quãng đường chỉ cộng giữa các mục có tọa độ liền nhau', () => {
  const coords: Record<string, { lat: number; lon: number }> = { a: { lat: 22.8233, lon: 104.9836 }, b: { lat: 23.28177778, lon: 105.35989444 } };
  const km = roadKm([item({ placeId: 'a' }), item({ placeId: null }), item({ placeId: 'b' })], (id) => coords[id] ?? null);
  assert.ok(km > 80 && km < 105, `khoảng 93 km, được ${km}`);
  assert.equal(roadKm([item({ placeId: 'a' })], (id) => coords[id] ?? null), 0);
});

test('tổng có thể vượt trần của từng mục (1.000.000.000 nghìn đồng): cộng bằng số, không ném lỗi', () => {
  const s = summarizeCosts({ items: [item({ costK: 900_000_000 }), item({ costK: 900_000_000 })] });
  assert.equal(s.totalK, 1_800_000_000);
});

for (const fixture of [
  { prices: [null, null], known: 0, expected: 'Chưa có chi phí đã nhập' },
  { prices: [0, null], known: 1, expected: 'Đã biết 0 ₫, 1 mục chưa biết giá' },
  { prices: [120, null], known: 1, expected: 'Đã biết 120.000 ₫, 1 mục chưa biết giá' },
]) {
  test('chi phí hiển thị đúng độ đầy đủ: ' + fixture.expected, () => {
    const items = fixture.prices.map((costK) => item({ costK, day: '2026-10-31' }));
    items.push(item({ included: true, costK: 900, day: '2026-10-31' }));
    const costs = summarizeCosts({ items });
    assert.equal(costs.knownCount, fixture.known);
    assert.equal(costs.includedCount, 1);
    assert.equal(costs.totalK, fixture.prices[0] ?? 0);
    assert.equal(costSummaryText(costs).replaceAll('\u00a0', ' '), fixture.expected);
    assert.equal(costSummaryText(summarizeCosts({ items: dayItems({ items }, '2026-10-31') })), costSummaryText(costs));
  });
}

test('tổng thời gian đi ngày = cộng các chặng hiển thị: ba chặng ngắn là 45 phút, không phải 15', () => {
  // four close points (about 0.3 km) => each leg shows at least 15 minutes => total 45
  const coords: Record<string, { lat: number; lon: number }> = {
    a: { lat: 11.94, lon: 108.44 }, b: { lat: 11.9425, lon: 108.44 }, c: { lat: 11.945, lon: 108.44 }, d: { lat: 11.9475, lon: 108.44 },
  };
  const items = ['a', 'b', 'c', 'd'].map((p) => item({ id: p, placeId: p }));
  assert.equal(roadMinutes(items, (id) => coords[id] ?? null), 45);
  assert.equal(roadMinutes([item({ placeId: 'a' })], (id) => coords[id] ?? null), 0);
});
