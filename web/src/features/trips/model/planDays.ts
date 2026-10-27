import { airKm } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { Trip } from './trip.types.ts';
import { dayItems, tripDays, unassignedItems } from './tripMath.ts';
import type { DayPlan } from './tripState.ts';

/**
 * Gợi ý xếp các mục "Chưa có ngày" vào các ngày: đi từ mốc chính, luôn chọn nơi gần nhất tiếp theo (đường chim bay), mục không tọa độ
 * xếp sau; rồi chia đều các ngày theo số mục. Chỉ là gợi ý để người dùng chỉnh; KHÔNG phải tối ưu tuyến.
 */
export function planDays(t: Trip, coordOf: (placeId: string) => GeoPoint | null, hub: GeoPoint | null): DayPlan {
  const days = tripDays(t);
  const un = unassignedItems(t);
  const withCoord = un.filter((i) => i.placeId && coordOf(i.placeId));
  const withoutCoord = un.filter((i) => !(i.placeId && coordOf(i.placeId)));
  const order: typeof un = [];
  const pool = [...withCoord];
  let cur: GeoPoint | null = hub;
  while (pool.length) {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    pool.forEach((i, k) => {
      const p = coordOf(i.placeId as string) as GeoPoint;
      const d = cur ? airKm(cur, p) : 0;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    });
    const next = pool.splice(best, 1)[0];
    if (!next) break;
    order.push(next);
    cur = coordOf(next.placeId as string);
  }
  order.push(...withoutCoord);
  const counts = days.map((d) => dayItems(t, d).length);
  const assigned = t.items.length - un.length;
  const target = Math.ceil((assigned + order.length) / days.length);
  const plan: Record<string, { day: string; position: number }> = {};
  let di = 0;
  for (const i of order) {
    while (di < days.length - 1 && (counts[di] ?? 0) >= target) di += 1;
    plan[i.id] = { day: days[di] as string, position: counts[di] ?? 0 };
    counts[di] = (counts[di] ?? 0) + 1;
  }
  return plan;
}
