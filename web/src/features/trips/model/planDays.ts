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

/** It guesses no day for a booking/appointment time, promises no position and does not handle an arc that needs fixing by itself. */
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
 * A bounded suggestion for an item with no day: visiting + travel between points, keeping close clusters and the fixed schedule.
 * The part that does not fit stays in No date yet; no even splitting, no forcing into the last day, no claim that opening hours/appointment times were checked.
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

/** Keeps the old contract for a place that only needs a plan, and does not write or change the day of an already scheduled item on its own. */
export function planDays(t: Trip, coordinateOf: CoordinateOf, hub: GeoPoint | null, durationOf: DurationOf = () => null): DayPlan {
  return planPreview(t, coordinateOf, hub, durationOf).plan;
}

/** An explicit day choice is appended after the existing item; an invalid id/day is dropped and an already scheduled item is not edited. */
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
