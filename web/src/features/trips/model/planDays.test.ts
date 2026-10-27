import test from 'node:test';
import assert from 'node:assert/strict';
import { planDays } from './planDays.ts';
import { S0 as INITIAL_TRIPS_STATE, createTrip } from './tripFixtures.ts';

const HUB = { lat: 22.8233, lon: 104.9836 };
const COORDS: Record<string, { lat: number; lon: number }> = {
  near: { lat: 22.85, lon: 105.0 },
  mid: { lat: 23.1, lon: 105.2 },
  far: { lat: 23.36, lon: 105.31 },
  far2: { lat: 23.37, lon: 105.32 },
};
const coordOf = (id: string) => COORDS[id] ?? null;

/** Chuyến 2 ngày với các địa điểm cho trước. */
function trip(places: string[]) {
  return createTrip(INITIAL_TRIPS_STATE, { name: 'T', destinationId: 'd', startDate: '2026-10-31', endDate: '2026-11-01' }, places.map((id) => ({ id, category: 'canh' })), (() => { let n = 0; return () => `i${(n += 1)}`; })(), 1).trip;
}

test('xếp từ nơi gần mốc nhất và chia đều hai ngày; nơi gần nhau nằm cùng ngày', () => {
  const t = trip(['far2', 'near', 'far', 'mid']);
  const plan = planDays(t, coordOf, HUB);
  const byPlace = (p: string) => plan[t.items.find((i) => i.placeId === p)!.id];
  assert.equal(byPlace('near')?.day, '2026-10-31');
  assert.equal(byPlace('mid')?.day, '2026-10-31');
  assert.equal(byPlace('far')?.day, '2026-11-01');
  assert.equal(byPlace('far2')?.day, '2026-11-01');
  assert.deepEqual([byPlace('near')?.position, byPlace('mid')?.position], [0, 1]);
});

test('không có mục chưa xếp thì kế hoạch rỗng; mục không tọa độ xếp cuối', () => {
  assert.deepEqual(planDays(trip([]), coordOf, HUB), {});
  const t = trip(['near', 'khong-toa-do']);
  const plan = planDays(t, coordOf, HUB);
  assert.equal(Object.keys(plan).length, 2);
  assert.equal(plan[t.items[1]!.id]?.day, '2026-11-01');
});
