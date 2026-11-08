import test from 'node:test';
import assert from 'node:assert/strict';
import { planPreview, summarizePlan, withDayOverrides } from './planDays.ts';
import { planDraftKey } from './planDraft.ts';
import { S0, createTrip } from './tripFixtures.ts';
import type { Trip, TripItem } from './trip.types.ts';

const HUB = { lat: 11.94, lon: 108.44 };
const DAY = '2026-11-07';
const NEXT = '2026-11-08';
const points = { a: HUB, b: { lat: 12.03, lon: 108.44 }, c: { lat: 12.031, lon: 108.44 } };
const coordinates = (id: string) => points[id as keyof typeof points] ?? null;

test('bản nháp sống qua lượt đọc lại cùng dữ liệu; thay ngày, booking hoặc quyền làm bản nháp cũ hết hiệu lực', () => {
  const trip = sample(['a']);
  const key = planDraftKey(trip);
  assert.equal(planDraftKey(structuredClone(trip)), key);
  assert.notEqual(planDraftKey({ ...trip, endDate: NEXT }), key);
  assert.notEqual(planDraftKey({ ...trip, role: 'member' }), key);
  assert.notEqual(planDraftKey({ ...trip, items: [{ ...trip.items[0]!, booking: 'booked' }] }), key);
});

/** Các địa điểm chưa có ngày; không gọi API hay sửa fixture toàn cục. */
function sample(ids: string[], end = DAY): Trip {
  let sequence = 0;
  return createTrip(S0, { name: 'Kiểm an toàn gợi ý', destinationId: 'd', startDate: DAY, endDate: end }, ids.map(id => ({ id, category: 'canh' })), () => `s${++sequence}`, 1).trip;
}

test('hết ngày không ép mọi mục vào ngày cuối: phần dư vẫn chưa xếp và có lý do', () => {
  const trip = sample(['a', 'b', 'c']);
  const result = planPreview(trip, coordinates, HUB, () => 200);
  assert.equal(Object.keys(result.plan).length, 1);
  assert.equal(result.deferred.filter(item => item.reason === 'capacity').length, 2);
  assert.ok(result.days.every(day => !day.overloaded));
  assert.ok(trip.items.every(item => item.day === null));
});

test('đi hai nơi dưới 20km vẫn phải tính di chuyển, không chỉ cộng thời gian ghé', () => {
  const trip = sample(['a', 'b']);
  const distant = (id: string) => id === 'a' ? { lat: 12.3, lon: 108.44 } : { lat: 12.46, lon: 108.44 };
  const result = planPreview(trip, distant, HUB, () => 170);
  assert.equal(Object.keys(result.plan).length, 1, '340 phút ghé + tiếp cận vùng + chặng liên điểm vượt 8 giờ tổng');
  assert.equal(result.deferred.length, 1);
});

test('tính cả chặng từ mục cuối đã có ngày, không sửa giờ/booking hoặc đổi thứ tự cũ', () => {
  const base = sample(['a', 'b'], NEXT);
  const fixed: TripItem = { ...base.items[0]!, day: DAY, position: 0, durationMin: 330, timeOfDay: '09:00', booking: 'booked' };
  const trip = { ...base, items: [fixed, base.items[1]!] };
  const distant = (id: string) => id === 'a' ? { lat: 12.3, lon: 108.44 } : { lat: 12.46, lon: 108.44 };
  const result = planPreview(trip, distant, HUB, () => 15);
  assert.equal(result.plan[base.items[1]!.id]?.day, NEXT);
  assert.equal(result.plan[fixed.id], undefined);
  assert.deepEqual(trip.items[0], fixed);
});

test('bữa ăn thiếu thời lượng không chiếm 0 phút và vẫn báo chưa có thời lượng thật', () => {
  const base = sample(Array.from({ length: 7 }, (_, index) => `meal-${index}`), NEXT);
  const trip = { ...base, items: base.items.map(item => ({ ...item, type: 'food' as const })) };
  const result = planPreview(trip, () => HUB, HUB);
  assert.ok(Object.values(result.plan).some(assignment => assignment.day === NEXT));
  assert.equal(result.unknownDuration, 7);
  assert.ok(result.days.every(day => day.knownMinutes === 0));
});

test('địa điểm không có tọa độ giữ lại để chọn khu vực, không hứa gom gần nhau', () => {
  const result = planPreview(sample(['missing']), coordinates, HUB, () => 60);
  assert.deepEqual(result.plan, {});
  assert.equal(result.deferred[0]?.reason, 'location');
});

test('ý tưởng có mốc khu vực chưa phải một quán ăn: không dùng ghim đó để hứa lịch gần nhau', () => {
  const result = planPreview(sample(['exp-food-try-dish']), () => HUB, HUB, () => 45);
  assert.deepEqual(result.plan, {});
  assert.equal(result.deferred[0]?.reason, 'location');
});

test('booking chưa có ngày không được đoán ngày; mục được bảo vệ không vào gợi ý', () => {
  const base = sample(['a', 'b']);
  const trip = { ...base, items: base.items.map((item, index) => index === 0 ? { ...item, booking: 'booked' as const } : item) };
  const result = planPreview(trip, coordinates, HUB, () => 60, undefined, new Set([base.items[1]!.id]));
  assert.deepEqual(result.plan, {});
  assert.deepEqual(new Set(result.deferred.map(item => item.reason)), new Set(['booking', 'pending']));
});

test('đổi ngày trong preview tính lại di chuyển và báo quá dày, không dùng tổng cũ', () => {
  const trip = sample(['a', 'b']);
  const plan = Object.fromEntries(trip.items.map((item, position) => [item.id, { day: DAY, position }]));
  const distant = (id: string) => id === 'a' ? { lat: 12.3, lon: 108.44 } : { lat: 12.46, lon: 108.44 };
  const summary = summarizePlan(trip, plan, () => 170, distant, HUB);
  assert.ok(summary[0]!.travelMinutes > 20);
  assert.equal(summary[0]!.overloaded, true);
});

test('mục nghỉ/việc tự do không làm biến mất chặng đi giữa hai địa điểm đã biết', () => {
  const base = sample(['a', 'b']);
  const rest = { ...base.items[0]!, id: 'rest-between', placeId: null, type: 'rest' as const, day: DAY, position: 1, durationMin: 30 };
  const trip = { ...base, items: [{ ...base.items[0]!, day: DAY, position: 0 }, rest, base.items[1]!] };
  const plan = { [base.items[1]!.id]: { day: DAY, position: 2 } };
  const summary = summarizePlan(trip, plan, () => 60, coordinates, HUB)[0]!;
  assert.ok(summary.travelMinutes > 20);
  assert.ok(summary.unknownTravelCount > 0, 'vẫn báo phần vị trí chưa rõ, không gọi là đã tính đủ');
});

test('ngày cũ quá dày vẫn được cảnh báo, không cần có điểm mới và không tự sửa lịch', () => {
  const base = sample(['a']);
  const trip = { ...base, items: [{ ...base.items[0]!, day: DAY, position: 0, durationMin: 600 }] };
  const result = planPreview(trip, coordinates, HUB);
  assert.equal(result.days[0]!.overloaded, true);
  assert.deepEqual(result.plan, {});
  assert.equal(trip.items[0]!.durationMin, 600);
});

test('chọn ngày tường minh cho mục giữ lại, bỏ ngày/ID lạ và không dời mục đã xếp', () => {
  const base = sample(['a', 'b'], NEXT);
  const fixed = { ...base.items[0]!, day: DAY, position: 0 };
  const trip = { ...base, items: [fixed, base.items[1]!] };
  const selected = withDayOverrides(trip, {}, { [fixed.id]: NEXT, [base.items[1]!.id]: NEXT, unknown: DAY });
  assert.deepEqual(Object.keys(selected), [base.items[1]!.id]);
  assert.equal(selected[base.items[1]!.id]!.day, NEXT);
  assert.deepEqual(withDayOverrides(trip, selected, { [base.items[1]!.id]: '2026-12-01' }), {});
  assert.deepEqual(withDayOverrides(trip, selected, { [base.items[1]!.id]: '' }), {});
});
