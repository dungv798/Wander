import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { Trip, TripItem } from './trip.types.ts';
import type { DayPlan } from './tripState.ts';
import type { CoordinateOf, DurationOf, PlanDayPreview } from './planDays.types.ts';
import { dayItems, tripDays } from './tripMath.ts';
import { itemPoint, planningCapacity, planningTravel, planningWeight, visitMinutes } from './planPolicy.ts';
import { PLAN_DAYS as P } from './planDays.const.ts';

/** Keeps the leg between known positions as a minimum estimate; an item missing a position is still counted so it does not promise everything was computed. */
export function measurePlanRoute(items: readonly TripItem[], coordinateOf: CoordinateOf, origin: GeoPoint | null) {
  let last = origin, minutes = 0, unknown = 0;
  for (const item of items) {
    const point = itemPoint(item, coordinateOf);
    if (!point) { unknown++; continue; }
    const travel = planningTravel(last, point);
    if (travel === null) unknown++;
    else minutes += travel;
    last = point;
  }
  return { minutes, unknown, last };
}

/** Recomputes the visits, the legs between points, the fixed items and the missing data after every day change in the preview. */
export function summarizePlan(t: Trip, plan: DayPlan, durationOf: DurationOf, coordinateOf: CoordinateOf = () => null, hub: GeoPoint | null = null): PlanDayPreview[] {
  let origin = hub;
  let uncertainOrigin = false;
  return tripDays(t).map(day => {
    const added = t.items.filter(item => item.day === null && plan[item.id]?.day === day).sort((a, b) => plan[a.id]!.position - plan[b.id]!.position);
    const current = dayItems(t, day);
    const all = [...current, ...added];
    const route = measurePlanRoute(all, coordinateOf, origin);
    const unknownTravelCount = route.unknown + (uncertainOrigin && all.length ? 1 : 0);
    if (all.length) { origin = route.last; uncertainOrigin = unknownTravelCount > 0; }
    const known = (items: readonly TripItem[]): number => items.reduce((sum, item) => sum + (visitMinutes(item, durationOf) ?? 0), 0);
    const missing = (items: readonly TripItem[]): number => items.filter(item => visitMinutes(item, durationOf) === null).length;
    const visits = all.reduce((sum, item) => sum + planningWeight(item, durationOf), 0);
    const loadMinutes = visits + route.minutes;
    const overloaded = loadMinutes > P.dayTotalMin || visits > planningCapacity(all, durationOf);
    return { day, itemIds: added.map(item => item.id), existingIds: current.map(item => item.id), knownMinutes: known(added), totalKnownMinutes: known(all), unknownCount: missing(added), totalUnknownCount: missing(all), travelMinutes: route.minutes, unknownTravelCount, loadMinutes, capacityMinutes: P.dayTotalMin, timedCount: all.filter(item => item.timeOfDay !== null).length, overloaded, empty: !all.length };
  });
}
