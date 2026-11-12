import { FORMAT } from '../const/format.const.ts';

const DAYS_IN_WEEK = 7;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_OF_MONTH_START = 8;
const MONTH_START = 5;
const YEAR_END = 4;

/** Reads a `yyyy-mm-dd` date string as a UTC midnight instant; returns null when the format is wrong or the date does not exist (for example 2026-02-30). */
export function parseIsoDate(iso: string): Date | null {
  const m = ISO_PATTERN.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return toIsoDate(d) === iso ? d : null;
}

/** Turns a UTC instant into a `yyyy-mm-dd` string (a calendar date, independent of the device time zone). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 'yyyy-mm-dd'.length);
}

/** Adds (or subtracts) a number of calendar days to a `yyyy-mm-dd` date. */
export function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  if (!d) throw new RangeError(`Ngày không hợp lệ: ${iso}`);
  d.setUTCDate(d.getUTCDate() + n);
  return toIsoDate(d);
}

/** The number of calendar days from `a` to `b`, both ends counted (R5: a trip 29/08-06/09 is 9 days). */
export function inclusiveDays(a: string, b: string): number {
  const da = parseIsoDate(a);
  const db = parseIsoDate(b);
  if (!da || !db) throw new RangeError('Ngày không hợp lệ');
  return Math.round((db.getTime() - da.getTime()) / FORMAT.MS_PER_DAY) + 1;
}

/** The 'dd/mm' of a `yyyy-mm-dd` date. */
export function dayMonth(iso: string): string {
  return `${iso.slice(DAY_OF_MONTH_START)}/${iso.slice(MONTH_START, DAY_OF_MONTH_START - 1)}`;
}

/** A short label like 'Sat 31/10' (the weekday by the UTC calendar date). */
export function dayLabel(iso: string): string {
  const d = parseIsoDate(iso);
  return d ? `${FORMAT.WEEKDAYS[d.getUTCDay()] ?? ''} ${dayMonth(iso)}` : '';
}

/** A full label like 'Sat, 31/10/2026'; an empty string when there is no date. */
export function fullDate(iso: string | null | undefined): string {
  const d = iso ? parseIsoDate(iso) : null;
  if (!iso || !d) return '';
  return `${FORMAT.WEEKDAYS[d.getUTCDay()] ?? ''}, ${dayMonth(iso)}/${iso.slice(0, YEAR_END)}`;
}

/** Today by the user's device calendar, as `yyyy-mm-dd` (Tier B: 'today' by the device time zone). */
export function todayLocal(now: Date = new Date()): string {
  return toIsoDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** The nearest date AFTER `from` (not counting `from`) that falls on weekday `weekday` (0 = Sunday ... 6 = Saturday), as `yyyy-mm-dd`. Used to suggest 'next Saturday'. */
export function nextWeekday(from: string, weekday: number): string {
  const d = parseIsoDate(from);
  if (!d) throw new RangeError(`Ngày không hợp lệ: ${from}`);
  const diff = (weekday - d.getUTCDay() + DAYS_IN_WEEK) % DAYS_IN_WEEK || DAYS_IN_WEEK;
  return addDays(from, diff);
}
