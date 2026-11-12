import { LIMITS } from '../const/limits.const.ts';
import { addDays, inclusiveDays, parseIsoDate } from '../lib/dates.ts';

/** The date-range error code; the same as the backend (`START_REQUIRED`, `END_BEFORE_START`...). */
export type DateRangeErrorCode = 'START_REQUIRED' | 'END_REQUIRED' | 'INVALID_DATE' | 'END_BEFORE_START' | 'TOO_MANY_DAYS';

/** A trip date-range error. */
export class DateRangeError extends Error {
  readonly code: DateRangeErrorCode;

  /** Creates an error with a specific code. */
  constructor(code: DateRangeErrorCode) {
    super(code);
    this.name = 'DateRangeError';
    this.code = code;
  }
}

/** The date range of a trip: the start and end dates (both ends included, R5), at most 366 days. Immutable. */
export class DateRange {
  readonly start: string;
  readonly end: string;

  /** A private constructor: use `of` to check the invariant. */
  private constructor(start: string, end: string) {
    this.start = start;
    this.end = end;
  }

  /** Creates a date range from two `yyyy-mm-dd` strings; throws `DateRangeError` when missing, wrong or too long. */
  static of(start: string, end: string): DateRange {
    if (!start) throw new DateRangeError('START_REQUIRED');
    if (!end) throw new DateRangeError('END_REQUIRED');
    if (!parseIsoDate(start) || !parseIsoDate(end)) throw new DateRangeError('INVALID_DATE');
    const n = inclusiveDays(start, end);
    if (n < 1) throw new DateRangeError('END_BEFORE_START');
    if (n > LIMITS.MAX_TRIP_DAYS) throw new DateRangeError('TOO_MANY_DAYS');
    return new DateRange(start, end);
  }

  /** The number of calendar days, both ends included. */
  get length(): number {
    return inclusiveDays(this.start, this.end);
  }

  /** The list of every `yyyy-mm-dd` day from the start date to the end date. */
  days(): string[] {
    return Array.from({ length: this.length }, (_, i) => addDays(this.start, i));
  }

  /** Whether the date `iso` is within the range (comparing ISO strings in the correct time order). */
  contains(iso: string): boolean {
    return iso >= this.start && iso <= this.end;
  }
}
