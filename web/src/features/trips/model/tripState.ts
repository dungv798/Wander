import { LIMITS } from '../../../shared/const/limits.const.ts';
import { randomId } from '../../../shared/lib/randomId.ts';
import type { Trip, TripItem, TripsState } from './trip.types.ts';
import { dayItems, tripDays } from './tripMath.ts';

/** The source of ids (replaceable in tests, the D principle). */
export type IdSource = () => string;

/** The default id source: see `shared/lib/randomId.ts`. */
export { randomId };

/** The initial state: no trip yet. */
export const INITIAL_TRIPS_STATE: TripsState = { trips: [] };

/** The first suffix when a name clashes (' - 2') and the length of the short code when suffixes run out. */
const FIRST_SUFFIX = 2;
const SHORT_ID_LENGTH = 4;

/** A trip name that does not clash (DR-006): adds the suffix ' - 2', ' - 3'... on a clash (cutting the start so the name stays <= 120 characters); after 200 tries it adds a short code. */
export function uniqueName(trips: readonly Trip[], base: string, id: IdSource = randomId): string {
  const names = new Set(trips.map((t) => t.name));
  if (!names.has(base)) return base;
  const withSuffix = (suffix: string): string => `${base.slice(0, LIMITS.MAX_TRIP_NAME - suffix.length)}${suffix}`;
  for (let n = FIRST_SUFFIX; n < LIMITS.MAX_NAME_SUFFIX; n += 1) if (!names.has(withSuffix(` - ${n}`))) return withSuffix(` - ${n}`);
  return withSuffix(` - ${id().slice(0, SHORT_ID_LENGTH)}`);
}

/** The information to create a new trip. */
export interface NewTrip {
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly datesTentative?: boolean;
  readonly kind?: string | null;
  readonly interests?: readonly string[];
  readonly styles?: readonly string[];
  readonly pace?: string | null;
  readonly budgetK?: number | null;
}

/** The place to add to the trip (only the id and the place kind in the catalog are needed to infer the item kind). */
export interface PlaceRef {
  readonly venue?: { readonly kind: 'restaurant' | 'cafe' | 'bar' | 'lodging' } | null;
  readonly id: string;
  /** The display name (if any): the backend requires an item to have a title, so an item from the catalog carries its name as the stored title. */
  readonly name?: string;
  readonly category: string;
}

/**
 * Renumbers the order 0..n-1 within each day (keeping the existing order; an item with an empty `position` goes last in the order added) and drops the order of items
 * with no day yet. Called after every change of day/add/remove so there are no gaps or repeated numbers (the 0..n-1 invariant like the backend's `Trip.renumber`).
 */
export function normalize(t: Trip): Trip {
  const order = new Map<string, number>();
  for (const d of new Set(t.items.flatMap((i) => (i.day ? [i.day] : [])))) dayItems(t, d).forEach((i, k) => order.set(i.id, k));
  return { ...t, items: t.items.map((i) => (i.day ? { ...i, position: order.get(i.id) ?? null } : { ...i, position: null })) };
}

/** The changes allowed when editing an item. */
export type ItemPatch = Partial<Omit<TripItem, 'id' | 'placeId'>>;

/** The day-scheduling suggestion result: item id -> day and position. */
export type DayPlan = Readonly<Record<string, { readonly day: string; readonly position: number }>>;

/** The trip edit information (name, dates) and the option to shift the schedule. */
export interface TripEdit {
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  /** Keeping the number of days shifts the whole schedule by the new dates. */
  readonly shift: boolean;
  /** Drops the 'tentative' label (the dates are confirmed). */
  readonly confirmDates: boolean;
}

/** The trip edit result: the new trip, the number of items and the ids of items that fall out of the date range (back to 'No date yet', A1 DR-011). */
export interface EditResult {
  readonly trip: Trip;
  readonly lost: number;
  readonly lostIds: readonly string[];
}

/** Edits the trip name/dates. Items on a day that is cut go back to 'No date yet' instead of blocking (DR-011 A1 = b); the ids of the items pushed out are returned in `lostIds`. */
export function editTrip(t: Trip, e: TripEdit): EditResult {
  const oldDays = tripDays(t);
  const newDays = tripDays({ startDate: e.startDate, endDate: e.endDate });
  const same = newDays.length === oldDays.length && e.shift;
  const mapDay = (d: string | null): string | null => {
    if (!d) return null;
    if (same) return newDays[oldDays.indexOf(d)] ?? null;
    return newDays.includes(d) ? d : null;
  };
  const lostIds = t.items.filter((i) => i.day && !mapDay(i.day)).map((i) => i.id);
  const items = t.items.map((i) => ({ ...i, day: mapDay(i.day) }));
  /** The trash shifts with the schedule by the same rule (a day not in the old range is kept so restoring reports the right reason). */
  const trash = t.trash.map((x) => (same && x.day && oldDays.includes(x.day) ? { ...x, day: newDays[oldDays.indexOf(x.day)] ?? null } : x));
  return { trip: normalize({ ...t, name: e.name, startDate: e.startDate, endDate: e.endDate, datesTentative: e.confirmDates ? false : t.datesTentative, items, trash }), lost: lostIds.length, lostIds };
}
