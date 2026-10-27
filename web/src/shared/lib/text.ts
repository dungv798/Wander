import { UI } from '../const/app.const.ts';
import { COPY } from '../const/copy.vi.ts';

const COMBINING_MARKS = /\p{M}+/gu;

/** Chuẩn hóa chuỗi để so khớp không phân biệt hoa thường và dấu tiếng Việt ("ha giang" khớp "Hà Giang"); như `SearchText` của backend. */
export function normalizeSearch(s: string): string {
  return s.trim().replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
}

/** Gộp các tháng liền nhau: [9,10,11] → "Tháng 9–11"; [3,4,9,10,11] → "Tháng 3–4, 9–11"; rỗng → "". */
export function monthRangeLabel(months: readonly number[], prefix: string = COPY.units.monthPrefix): string {
  const sorted = [...new Set(months.map(Number).filter((m) => m >= 1 && m <= UI.MONTHS_IN_YEAR))].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && (sorted[j + 1] ?? 0) === (sorted[j] ?? 0) + 1) j += 1;
    parts.push(j > i ? `${sorted[i]}–${sorted[j]}` : String(sorted[i]));
    i = j + 1;
  }
  return parts.length ? prefix + parts.join(', ') : '';
}
