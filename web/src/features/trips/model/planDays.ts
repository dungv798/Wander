import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { dayItems, tripDays, unassignedItems } from './tripMath.ts';
import type { DayPlan } from './tripState.ts';
import type { CoordinateOf, DeferredPlanItem, DeferredReason, DurationOf, PlanPreview } from './planDays.types.ts';
import { itemPoint } from './planPolicy.ts';
import { visitOrder } from './planRoute.ts';
import { packPlan } from './planPacking.ts';
import { summarizePlan } from './planSummary.ts';

export { summarizePlan } from './planSummary.ts';
export type { PlanDayPreview, PlanPreview, DeferredPlanItem, DeferredReason } from './planDays.types.ts';

/** Không đoán ngày cho booking/giờ hẹn, không hứa vị trí hay tự xử lý cung cần chốt. */
function holdReason(item: TripItem, coordinateOf: CoordinateOf, manualIds?: ReadonlySet<string>, protectedIds?: ReadonlySet<string>): DeferredReason | null {
  if (protectedIds?.has(item.id)) return 'pending';
  if (item.type === 'lodging') return 'stay';
  if (manualIds?.has(item.id)) return 'manual';
  if (item.booking === 'booked') return 'booking';
  if (item.timeOfDay !== null) return 'time';
  if (!itemPoint(item, coordinateOf)) return 'location';
  return null;
}

/**
 * Gợi ý có giới hạn cho mục chưa có ngày: ghé + di chuyển liên điểm, giữ cụm gần nhau và lịch cố định.
 * Phần chưa vừa vẫn trong Chưa có ngày; không chia đều, không ép ngày cuối, không tuyên bố đã kiểm giờ mở cửa/giờ hẹn.
 */
export function planPreview(t: Trip, coordinateOf: CoordinateOf, hub: GeoPoint | null, durationOf: DurationOf = () => null, manualIds?: ReadonlySet<string>, protectedIds?: ReadonlySet<string>): PlanPreview {
  const unassigned = unassignedItems(t);
  const deferred: DeferredPlanItem[] = [];
  const candidates = unassigned.filter(item => {
    const reason = holdReason(item, coordinateOf, manualIds, protectedIds);
    if (reason) deferred.push({ itemId: item.id, reason });
    return reason === null;
  });
  const packed = packPlan(t, visitOrder(candidates, coordinateOf, hub), coordinateOf, hub, durationOf);
  const days = summarizePlan(t, packed.plan, durationOf, coordinateOf, hub);
  return {
    plan: packed.plan, days, deferred: [...deferred, ...packed.deferred],
    emptyDays: days.filter(day => day.empty).map(day => day.day),
    unknownDuration: days.reduce((sum, day) => sum + day.unknownCount, 0),
    manualItemIds: unassigned.filter(item => manualIds?.has(item.id)).map(item => item.id),
  };
}

/** Giữ hợp đồng cũ cho nơi chỉ cần kế hoạch, không tự ghi hay thay ngày của mục đã xếp. */
export function planDays(t: Trip, coordinateOf: CoordinateOf, hub: GeoPoint | null, durationOf: DurationOf = () => null): DayPlan {
  return planPreview(t, coordinateOf, hub, durationOf).plan;
}

/** Lựa chọn ngày tường minh được nối sau mục có sẵn; bỏ ID/ngày không hợp lệ và không sửa mục đã xếp. */
export function withDayOverrides(t: Trip, plan: DayPlan, overrides: Readonly<Record<string, string>>): DayPlan {
  const result: Record<string, { day: string; position: number }> = {};
  const days = new Set(tripDays(t));
  const unassigned = new Map(unassignedItems(t).map(item => [item.id, item]));
  const next = new Map<string, number>();
  const ids = [...new Set([...Object.keys(plan), ...Object.keys(overrides)])].filter(id => unassigned.has(id));
  ids.sort((a, b) => (plan[a]?.position ?? Number.MAX_SAFE_INTEGER) - (plan[b]?.position ?? Number.MAX_SAFE_INTEGER));
  for (const id of ids) {
    const day = overrides[id] ?? plan[id]?.day;
    if (!day || !days.has(day)) continue;
    const position = next.get(day) ?? dayItems(t, day).length;
    next.set(day, position + 1);
    result[id] = { day, position };
  }
  return result;
}
