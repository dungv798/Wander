import { RATING } from './rating.const.ts';

/** Điểm trung bình theo cách đọc của người Việt (dấu phẩy thập phân), ví dụ 4,5; null ⇒ chuỗi rỗng. */
export function formatAverage(average: number | null): string {
  if (average === null) return '';
  return average.toLocaleString(RATING.LOCALE, { minimumFractionDigits: RATING.AVERAGE_DIGITS, maximumFractionDigits: RATING.AVERAGE_DIGITS });
}

/** Hàng sao dạng chữ cho `stars` điểm trên tổng 5, ví dụ 4 ⇒ ★★★★☆; giá trị ngoài 0–5 bị kẹp lại. */
export function starsText(stars: number): string {
  const filled = Math.max(0, Math.min(RATING.MAX_STARS, Math.round(stars)));
  return RATING.FILLED_STAR.repeat(filled) + RATING.EMPTY_STAR.repeat(RATING.MAX_STARS - filled);
}
