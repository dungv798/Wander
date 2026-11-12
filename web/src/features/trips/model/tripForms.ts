import { LIMITS } from '../../../shared/const/limits.const.ts';
import { normalizeTripTime } from './tripTime.ts';
import { DateRange, DateRangeError } from '../../../shared/domain/DateRange.ts';
import { Money, MoneyError } from '../../../shared/domain/Money.ts';
import { addDays } from '../../../shared/lib/dates.ts';
import type { ItemKind, TripItem } from './trip.types.ts';
import { isPlain } from './tripMath.ts';
import { TRIPS_COPY as COPY } from './trips.copy.ts';

/** The result of checking a form: a valid value or a Vietnamese hint to show beside the box/in the warning frame. */
export type Parsed<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: string };

/** A valid value. */
function ok<T>(value: T): Parsed<T> {
  return { ok: true, value };
}
/** An error with a hint. */
function fail<T>(error: string): Parsed<T> {
  return { ok: false, error };
}

/** Reads a money box (thousand VND): empty -> null (unknown); wrong returns a hint by the error code of `Money`. */
export function parseMoneyField(text: string, field: string): Parsed<number | null> {
  try {
    return ok(Money.parse(text)?.thousand ?? null);
  } catch (e) {
    if (e instanceof MoneyError) return fail(`${field}: ${COPY.errors.money[e.code]}`);
    throw e;
  }
}

/** The date data of the trip form. */
export interface DatesInput {
  readonly start: string;
  readonly end: string;
  readonly tentative: boolean;
  /** The expected number of days (the typed string) when the dates are tentative. */
  readonly days: string;
}

/** The valid dates of the trip. */
export interface TripDates {
  readonly startDate: string;
  readonly endDate: string;
  readonly datesTentative: boolean;
}

/** Checks the dates: tentative computes the end date from the expected number of days (1-366); confirmed needs an end date >= the start date, at most 366 days. */
export function parseDates(d: DatesInput): Parsed<TripDates> {
  if (!d.start) return fail(COPY.errors.startRequired);
  let end = d.end;
  if (d.tentative) {
    const n = /^\d+$/.test(d.days.trim()) ? Number(d.days.trim()) : 0;
    if (n < 1 || n > LIMITS.MAX_TRIP_DAYS) return fail(COPY.errors.tentativeDays);
    end = addDays(d.start, n - 1);
  }
  try {
    const r = DateRange.of(d.start, end);
    return ok({ startDate: r.start, endDate: r.end, datesTentative: d.tentative });
  } catch (e) {
    if (e instanceof DateRangeError) return fail(COPY.errors.dates[e.code]);
    throw e;
  }
}

/** The item form data (raw typed strings). */
export interface ItemForm {
  readonly title: string;
  readonly type: ItemKind;
  readonly isPlace: boolean;
  readonly day: string;
  readonly time: string;
  readonly duration: string;
  readonly note: string;
  readonly cost: string;
  readonly included: boolean;
  readonly reference: string;
  readonly booked: boolean;
}

/** The edit part of an item after checking; `clearsPrice` says that changing to Rest/To-do will clear the price data (needs confirmation). */
export interface ItemValues {
  readonly patch: Pick<TripItem, 'title' | 'type' | 'day' | 'timeOfDay' | 'durationMin' | 'note' | 'costK' | 'included' | 'referenceK' | 'booking'>;
}

/** Checks the item form by D17/D18 and the backend limits (name <= 200, duration <= 7 days, note <= 2000). */
export function parseItemForm(f: ItemForm): Parsed<ItemValues> {
  const title = f.title.trim();
  if (!f.isPlace && !title) return fail(COPY.errors.itemTitle);
  if (title.length > LIMITS.MAX_ITEM_TITLE) return fail(COPY.errors.itemTitleLong);
  if (f.note.trim().length > LIMITS.MAX_ITEM_NOTE) return fail(COPY.errors.noteLong);
  const durText = f.duration.trim();
  let durationMin: number | null = null;
  if (durText) {
    if (!/^\d+$/.test(durText) || Number(durText) > LIMITS.MAX_DURATION_MIN) return fail(COPY.errors.duration);
    durationMin = Number(durText);
  }
  const time = normalizeTripTime(f.time);
  if (time === null) return fail(COPY.editor.invalidTime);
  const plain = isPlain(f.type);
  let costK: number | null = null;
  let referenceK: number | null = null;
  if (!plain) {
    const cost = parseMoneyField(f.cost, COPY.item.cost);
    if (!cost.ok) return cost;
    costK = cost.value;
    if (f.included && f.reference.trim()) {
      const ref = parseMoneyField(f.reference, COPY.item.reference);
      if (!ref.ok) return ref;
      referenceK = ref.value;
    }
  }
  return ok({ patch: { title: f.isPlace ? '' : title, type: f.type, day: f.day || null, timeOfDay: time || null, durationMin, note: f.note.trim(), costK, included: !plain && f.included, referenceK, booking: plain ? null : f.booked ? 'booked' : 'pending' } });
}

/** Checks the trip name (required, <= 120 characters; longer is cut). */
export function parseTripName(text: string): Parsed<string> {
  const name = text.trim();
  return name ? ok(name.slice(0, LIMITS.MAX_TRIP_NAME)) : fail(COPY.errors.tripName);
}
