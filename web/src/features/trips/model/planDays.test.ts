import test from 'node:test';
import assert from 'node:assert/strict';
import { planDays, planPreview, summarizePlan, withDayOverrides } from './planDays.ts';
import { S0 as INITIAL_TRIPS_STATE, createTrip } from './tripFixtures.ts';

const HUB = { lat: 11.94, lon: 108.44 };
// a,b sát nhau (~1 km); c cách ~12 km; far cách ~60 km (cụm khác)
const COORDS: Record<string, { lat: number; lon: number }> = {
  a: { lat: 11.9418, lon: 108.4468 }, b: { lat: 11.9475, lon: 108.4411 }, c: { lat: 12.03, lon: 108.45 }, far: { lat: 12.5, lon: 108.45 },
};
const coordOf = (id: string) => COORDS[id] ?? null;
const DAYS = ['2026-10-31', '2026-11-01'];

/** Chuyến với các địa điểm cho trước (chưa có ngày). */
function trip(places: string[], end = '2026-11-01') {
  const ids = (() => { let n = 0; return () => `i${(n += 1)}`; })();
  return createTrip(INITIAL_TRIPS_STATE, { name: 'T', destinationId: 'd', startDate: '2026-10-31', endDate: end }, places.map((id) => ({ id, category: 'canh' })), ids, 1).trip;
}
const dayOf = (t: ReturnType<typeof trip>, p: string, plan: ReturnType<typeof planDays>) => plan[t.items.find((i) => i.placeId === p)!.id]?.day;

test('khách sạn không bị tự xếp như chuyến ghé tham quan ngắn', () => {
  const t0 = trip(['a']);
  const t = { ...t0, items: t0.items.map(i => ({ ...i, type: 'lodging' as const })) };
  const r = planPreview(t, coordOf, HUB, () => 30);
  assert.deepEqual(r.plan, {});
  assert.equal(r.deferred[0]?.reason, 'stay');
});

test('hai nơi sát nhau trong chuyến hai ngày nằm CÙNG ngày; ngày còn lại để trống và được báo', () => {
  const t = trip(['a', 'b']);
  const r = planPreview(t, coordOf, HUB, () => 60);
  assert.equal(dayOf(t, 'a', r.plan), DAYS[0]);
  assert.equal(dayOf(t, 'b', r.plan), DAYS[0]);
  assert.deepEqual(r.emptyDays, [DAYS[1]]);
});

test('hai cụm xa nhau (hơn 20 km) tách sang hai ngày, không còn ngày trống', () => {
  const t = trip(['a', 'far']);
  const r = planPreview(t, coordOf, HUB, () => 60);
  assert.notEqual(dayOf(t, 'a', r.plan), dayOf(t, 'far', r.plan));
  assert.deepEqual(r.emptyDays, []);
});

test('nơi chiếm cả ngày tự đứng một ngày; hết sức chứa thì sang ngày sau', () => {
  const t = trip(['a', 'b']);
  const r = planPreview(t, coordOf, HUB, (id) => (id === 'a' ? 450 : 60));
  assert.equal(dayOf(t, 'a', r.plan), DAYS[0]);
  assert.equal(dayOf(t, 'b', r.plan), DAYS[1]);
});

test('quá nhiều cho số ngày: giữ phần dư ở Chưa có ngày, không ép quá tải hoặc làm mất mục', () => {
  const t = trip(['a', 'b', 'c'], '2026-10-31');
  const r = planPreview(t, coordOf, HUB, () => 200);
  assert.equal(Object.keys(r.plan).length, 1);
  assert.equal(r.deferred.length, 2);
  assert.equal(r.days[0]?.overloaded, false);
  assert.equal(t.items.length, 3);
});

test('nơi thiếu thời lượng được đếm riêng, không tự gán thời lượng hiển thị', () => {
  const t = trip(['a', 'b']);
  const r = planPreview(t, coordOf, HUB);
  assert.equal(r.unknownDuration, 2);
  assert.equal(r.days[0]?.knownMinutes, 0);
});

test('tính cả mục đã có ngày: ngày đã đầy thì mục mới sang ngày kế, không đụng mục cũ', () => {
  const t0 = trip(['a', 'b']);
  const placed = { ...t0, items: t0.items.map((i, k) => (k === 0 ? { ...i, day: DAYS[0]!, position: 0, durationMin: 330 } : i)) };
  const r = planPreview(placed, coordOf, HUB, () => 60);
  assert.equal(r.plan[placed.items[0]!.id], undefined);
  assert.equal(r.plan[placed.items[1]!.id]?.day, DAYS[1]);
});

test('không có mục chưa xếp thì kế hoạch rỗng', () => {
  assert.deepEqual(planDays(trip([]), coordOf, HUB), {});
});

test('đổi ngày trong bản xem trước đánh số lại vị trí liên tục', () => {
  const t = trip(['a', 'b']);
  const plan = planDays(t, coordOf, HUB, () => 60);
  const moved = withDayOverrides(t, plan, { [t.items[1]!.id]: DAYS[1]! });
  assert.equal(moved[t.items[1]!.id]?.day, DAYS[1]);
  assert.equal(moved[t.items[1]!.id]?.position, 0);
  assert.equal(moved[t.items[0]!.id]?.position, 0);
});

test('đổi ngày tính lại cả thời lượng, mục thiếu thời lượng và ngày trống', () => {
  const t = trip(['a', 'b']);
  const duration = (id: string) => id === 'a' ? 200 : null;
  const base = planPreview(t, coordOf, HUB, duration);
  const moved = withDayOverrides(t, base.plan, { [t.items[0]!.id]: DAYS[1]!, [t.items[1]!.id]: DAYS[1]! });
  const result = summarizePlan(t, moved, duration);
  assert.equal(result[0]?.empty, true);
  assert.equal(result[0]?.knownMinutes, 0);
  assert.equal(result[0]?.unknownCount, 0);
  assert.equal(result[1]?.knownMinutes, 200);
  assert.equal(result[1]?.unknownCount, 1);
  assert.equal(result[1]?.itemIds.length, 2);
});

test('cung cần tự chốt không được tự xếp hoặc biến mất khỏi chuyến', () => {
  const t = trip(['a', 'b']);
  const manualId = t.items[0]!.id;
  const before = structuredClone(t);
  const result = planPreview(t, coordOf, HUB, () => null, new Set([manualId]));
  assert.equal(result.plan[manualId], undefined);
  assert.deepEqual(result.manualItemIds, [manualId]);
  assert.equal(Object.keys(result.plan).length, 1);
  assert.deepEqual(t, before);
});

test('mọi cung cần chốt tuyến: không tạo kế hoạch giả dù chuyến có ngày', () => {
  const t = trip(['a']);
  const result = planPreview(t, coordOf, HUB, () => null, new Set([t.items[0]!.id]));
  assert.deepEqual(result.plan, {});
  assert.equal(result.manualItemIds.length, 1);
});
