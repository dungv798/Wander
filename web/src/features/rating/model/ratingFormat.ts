import { RATING } from './rating.const.ts';

/** The average score the way Vietnamese people read it (a decimal comma), for example 4,5; null => an empty string. */
export function formatAverage(average: number | null): string {
  if (average === null) return '';
  return average.toLocaleString(RATING.LOCALE, { minimumFractionDigits: RATING.AVERAGE_DIGITS, maximumFractionDigits: RATING.AVERAGE_DIGITS });
}

/** A text row of stars for `stars` points out of 5, for example 4 => a row of four filled and one empty star; a value outside 0-5 is clamped. */
export function starsText(stars: number): string {
  const filled = Math.max(0, Math.min(RATING.MAX_STARS, Math.round(stars)));
  return RATING.FILLED_STAR.repeat(filled) + RATING.EMPTY_STAR.repeat(RATING.MAX_STARS - filled);
}
