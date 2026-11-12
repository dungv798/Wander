import { minutesForKm, roadKmBetween } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { TripItem } from './trip.types.ts';
import type { CoordinateOf, DurationOf } from './planDays.types.ts';
import { PLAN_DAYS as P } from './planDays.const.ts';

/** Prefers the minutes the user entered; a missing value must not be turned into a real duration. */
export function visitMinutes(item: TripItem, durationOf: DurationOf): number | null {
  return item.durationMin ?? (item.placeId ? durationOf(item.placeId) : null);
}

/** The weight is only for suggesting, every item kind lacking a duration takes up room in the day. */
export function planningWeight(item: TripItem, durationOf: DurationOf): number {
  return visitMinutes(item, durationOf) ?? P.unknownByKind[item.type];
}

/** Accepts only finite coordinates; it does not use (0,0) to stand for an unknown place. */
export function itemPoint(item: TripItem, coordinateOf: CoordinateOf): GeoPoint | null {
  // A catalog convention: exp-* is an idea with a regional landmark, not yet an exact venue/meeting point to promise clustering.
  if (item.placeId?.startsWith('exp-')) return null;
  const point = item.placeId ? coordinateOf(item.placeId) : null;
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lon) ? point : null;
}

/** The unrounded minutes between points, using the app's existing road/speed factors; null means the leg is unknown. */
export function planningTravel(from: GeoPoint | null, to: GeoPoint | null): number | null {
  return from && to ? minutesForKm(roadKmBetween(from, to)) : null;
}

/** A long activity can stand alone for a whole day, but must still leave room for travel within the assumed 8-hour ceiling. */
export function planningCapacity(items: readonly TripItem[], durationOf: DurationOf): number {
  const only = items.length === 1 ? items[0] : undefined;
  const duration = only ? visitMinutes(only, durationOf) : null;
  return duration !== null && duration > P.dayCapacityMin && duration <= P.fullDayMin ? P.fullDayMin : P.dayCapacityMin;
}
