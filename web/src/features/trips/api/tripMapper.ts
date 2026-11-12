import { KIND_ORDER } from '../model/trip.const.ts';
import { parseCover } from '../model/cover.ts';
import type { BookingStatus, ItemKind, TrashEntry, Trip, TripItem } from '../model/trip.types.ts';

/** Whether it is a plain object (not null, not an array). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A string or null; any other type counts as null. */
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

/** A non-negative integer or null; a negative/fractional/other type counts as invalid (when you need to tell 'wrong' from 'empty' use `badNumber`). */
function wholeOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : null;
}

/** A number that is present but wrong (negative, fractional, not a number): broken data, drop the whole item. */
function badNumber(v: unknown): boolean {
  return v !== null && v !== undefined && wholeOrNull(v) === null;
}

/** The code in a `{code,label}` element of the API; a wrong shape is dropped. */
function codeOf(v: unknown): string | null {
  return isRecord(v) && typeof v['code'] === 'string' ? v['code'] : null;
}

/** The list of codes from an array of `{code,label}`; a broken element is dropped. */
function codes(v: unknown): string[] {
  return Array.isArray(v) ? v.map(codeOf).filter((c): c is string => c !== null) : [];
}

/** An ISO instant to milliseconds since the epoch; a wrong shape gives 0. */
function millis(v: unknown): number {
  const t = typeof v === 'string' ? Date.parse(v) : Number.NaN;
  return Number.isNaN(t) ? 0 : t;
}

/** The booking status: only `pending|booked`, anything else (Rest/To-do) is null. */
function bookingOf(v: unknown): BookingStatus | null {
  return v === 'pending' || v === 'booked' ? v : null;
}

/** An item from the API (`ItemView`) to `TripItem`; broken or an unknown kind gives null (it does not crash the screen). A 'no date yet' item has `day`/`position` null. */
export function toItem(raw: unknown): TripItem | null {
  if (!isRecord(raw) || typeof raw['id'] !== 'string') return null;
  const type = KIND_ORDER.find((k) => k === raw['type']) as ItemKind | undefined;
  if (!type || badNumber(raw['costK']) || badNumber(raw['referenceK']) || badNumber(raw['durationMin'])) return null;
  const day = strOrNull(raw['day']);
  return {
    id: raw['id'],
    placeId: strOrNull(raw['placeId']),
    type,
    title: typeof raw['title'] === 'string' ? raw['title'] : '',
    day,
    position: day === null ? null : wholeOrNull(raw['position']),
    timeOfDay: strOrNull(raw['timeOfDay']),
    durationMin: wholeOrNull(raw['durationMin']),
    note: typeof raw['note'] === 'string' ? raw['note'] : '',
    costK: wholeOrNull(raw['costK']),
    included: raw['included'] === true,
    referenceK: wholeOrNull(raw['referenceK']),
    booking: bookingOf(raw['booking']),
    done: raw['done'] === true,
    addedBy: strOrNull(raw['addedBy']),
    doneBy: Array.isArray(raw['doneBy']) ? raw['doneBy'].filter((x): x is string => typeof x === 'string') : [],
  };
}

/** A soft-deleted item from the API to `TrashEntry` (keeping the day and position at the time of deletion); with no `deletedAt` or a broken item gives null. */
export function toTrash(raw: unknown): TrashEntry | null {
  const item = toItem(raw);
  if (!item || !isRecord(raw) || typeof raw['deletedAt'] !== 'string') return null;
  return { id: item.id, item, deletedAt: millis(raw['deletedAt']), day: item.day, position: item.position };
}

/** Merges the days and the 'no date yet' items of `TripDetail` into one flat list (a broken item is dropped). */
export function detailItems(detail: unknown): TripItem[] {
  if (!isRecord(detail)) return [];
  const days = Array.isArray(detail['days']) ? detail['days'] : [];
  const fromDays = days.flatMap((d) => (isRecord(d) && Array.isArray(d['items']) ? d['items'] : []));
  const unscheduled = Array.isArray(detail['unscheduled']) ? detail['unscheduled'] : [];
  return [...fromDays, ...unscheduled].map(toItem).filter((i): i is TripItem => i !== null);
}

/** The API `TripView` together with the items and the trash into `Trip`; a missing required field gives null. `kind` is a CODE (the label is looked up in `TRIP_KINDS`). */
export function toTrip(view: unknown, items: readonly TripItem[], trash: readonly TrashEntry[]): Trip | null {
  if (!isRecord(view)) return null;
  const { id, name, destination, startDate, endDate } = view;
  if (typeof id !== 'string' || typeof name !== 'string' || typeof destination !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') return null;
  return {
    id,
    role: view['role'] === 'organizer' ? 'organizer' : 'member',
    memberCount: typeof view['memberCount'] === 'number' && view['memberCount'] >= 1 ? view['memberCount'] : 1,
    selfMemberId: strOrNull(view['selfMemberId']),
    name,
    destinationId: destination,
    cover: parseCover(view['cover']),
    startDate,
    endDate,
    datesTentative: view['datesTentative'] === true,
    kind: codeOf(view['kind']),
    interests: codes(view['interests']),
    styles: codes(view['styles']),
    pace: codeOf(view['pace']),
    budgetK: wholeOrNull(view['budgetK']),
    items,
    trash,
    createdAt: millis(view['createdAt']),
  };
}
