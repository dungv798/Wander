import { LIMITS } from '../const/limits.const.ts';
import { addDays, inclusiveDays, parseIsoDate } from '../lib/dates.ts';

/** Mã lỗi khoảng ngày; trùng backend (`START_REQUIRED`, `END_BEFORE_START`…). */
export type DateRangeErrorCode = 'START_REQUIRED' | 'END_REQUIRED' | 'INVALID_DATE' | 'END_BEFORE_START' | 'TOO_MANY_DAYS';

/** Lỗi khoảng ngày chuyến đi. */
export class DateRangeError extends Error {
  readonly code: DateRangeErrorCode;

  /** Tạo lỗi với mã cụ thể. */
  constructor(code: DateRangeErrorCode) {
    super(code);
    this.name = 'DateRangeError';
    this.code = code;
  }
}

/** Khoảng ngày của chuyến: ngày đi và ngày về (gồm hai đầu, R5), không quá 366 ngày. Bất biến. */
export class DateRange {
  readonly start: string;
  readonly end: string;

  /** Hàm tạo riêng tư: dùng `of` để kiểm bất biến. */
  private constructor(start: string, end: string) {
    this.start = start;
    this.end = end;
  }

  /** Tạo khoảng ngày từ hai chuỗi `yyyy-mm-dd`; ném `DateRangeError` khi thiếu, sai hoặc quá dài. */
  static of(start: string, end: string): DateRange {
    if (!start) throw new DateRangeError('START_REQUIRED');
    if (!end) throw new DateRangeError('END_REQUIRED');
    if (!parseIsoDate(start) || !parseIsoDate(end)) throw new DateRangeError('INVALID_DATE');
    const n = inclusiveDays(start, end);
    if (n < 1) throw new DateRangeError('END_BEFORE_START');
    if (n > LIMITS.MAX_TRIP_DAYS) throw new DateRangeError('TOO_MANY_DAYS');
    return new DateRange(start, end);
  }

  /** Số ngày lịch, gồm hai đầu. */
  get length(): number {
    return inclusiveDays(this.start, this.end);
  }

  /** Danh sách mọi ngày `yyyy-mm-dd` từ ngày đi đến ngày về. */
  days(): string[] {
    return Array.from({ length: this.length }, (_, i) => addDays(this.start, i));
  }

  /** Ngày `iso` có nằm trong khoảng không (so sánh chuỗi ISO đúng thứ tự thời gian). */
  contains(iso: string): boolean {
    return iso >= this.start && iso <= this.end;
  }
}
