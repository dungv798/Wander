import { TRIP_TIME as C } from './tripTime.const.ts';

/** Accepts HH:mm or four digits; an empty string clears the time, a wrong one returns null to block saving. */
export function normalizeTripTime(raw: string): string | null {
  const text = raw.trim();
  if (!text) return '';
  const match = /^(\d{2}):?(\d{2})$/.exec(text);
  if (!match || Number(match[1]) >= C.HOURS || Number(match[2]) >= C.MINUTES) return null;
  return `${match[1]}:${match[2]}`;
}

/** Creates choices with a leading zero, using the same rule for hours and minutes. */
export function timeOptions(count: number, step = 1): string[] {
  return Array.from({ length: count / step }, (_, i) => String(i * step).padStart(C.PART_DIGITS, '0'));
}
