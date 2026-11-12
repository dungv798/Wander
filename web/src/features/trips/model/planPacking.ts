import { airKm } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { Trip, TripItem } from './trip.types.ts';
import type { DayPlan } from './tripState.ts';
import type { CoordinateOf, DeferredPlanItem, DurationOf } from './planDays.types.ts';
import { PLAN_DAYS as P } from './planDays.const.ts';
import { tripDays } from './tripMath.ts';
import { itemPoint, planningCapacity, planningTravel, planningWeight } from './planPolicy.ts';
import { measurePlanRoute } from './planSummary.ts';

interface WorkingDay { readonly day: string; readonly items: TripItem[] }

/** Packs the fixed items in one pass by day, keeping the user's order; it does not edit the Trip's items. */
function workingDays(trip: Trip): WorkingDay[] {
  const buckets = new Map<string, TripItem[]>();
  for (const item of trip.items) if (item.day) {
    const bucket = buckets.get(item.day) ?? [];
    bucket.push(item);
    buckets.set(item.day, bucket);
  }
  return tripDays(trip).map(day => ({ day, items: (buckets.get(day) ?? []).sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)) }));
}

/** No verified lodging yet: it connects from the end point of the previous day, not defaulting to going back to a hub or moving instantly. */
function dayOrigin(days: readonly WorkingDay[], index: number, coordinateOf: CoordinateOf, hub: GeoPoint | null): GeoPoint | null {
  for (let previous = index - 1; previous >= 0; previous--) {
    const items = days[previous]!.items;
    for (let item = items.length - 1; item >= 0; item--) {
      const point = itemPoint(items[item]!, coordinateOf);
      if (point) return point;
    }
  }
  return hub;
}

/** Tries adding to the end of the day in the same order that would be sent to the server; computes unrounded minutes and the leg to get there. */
function fits(day: WorkingDay, item: TripItem, origin: GeoPoint | null, coordinateOf: CoordinateOf, durationOf: DurationOf): boolean {
  const route = measurePlanRoute(day.items, coordinateOf, origin);
  const point = itemPoint(item, coordinateOf);
  if (day.items.length && route.last && point && airKm(route.last, point) > P.sameAreaKm) return false;
  const visits = day.items.reduce((sum, current) => sum + planningWeight(current, durationOf), 0) + planningWeight(item, durationOf);
  const total = visits + route.minutes + (planningTravel(route.last, point) ?? 0);
  return visits <= planningCapacity([...day.items, item], durationOf) && total <= P.dayTotalMin;
}

/** Places only in a day that still fits; when days run out it keeps the item in deferred, not forcing the remainder into the last day. */
export function packPlan(trip: Trip, candidates: readonly TripItem[], coordinateOf: CoordinateOf, hub: GeoPoint | null, durationOf: DurationOf) {
  const days = workingDays(trip);
  const plan: Record<string, DayPlan[string]> = {};
  const deferred: DeferredPlanItem[] = [];
  let cursor = 0;
  for (const item of candidates) {
    let placed = false;
    for (let index = cursor; index < days.length; index++) {
      const day = days[index]!;
      if (!fits(day, item, dayOrigin(days, index, coordinateOf, hub), coordinateOf, durationOf)) continue;
      plan[item.id] = { day: day.day, position: day.items.length };
      day.items.push(item);
      cursor = index;
      placed = true;
      break;
    }
    if (!placed) deferred.push({ itemId: item.id, reason: 'capacity' });
  }
  return { plan, deferred };
}
