// Chuyến và ngày (R1, R5, R12; A-1, A-2). Ngày dạng "YYYY-MM-DD", tính theo UTC để không phụ thuộc múi giờ.

/** Giới hạn độ dài chuyến để tránh sinh quá nhiều ngày. Mặc định của implementation. */
export const MAX_TRIP_DAYS = 366;

export const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const;

export interface Day {
  date: string;
  /** Số thứ tự ngày, bắt đầu từ 1. */
  index: number;
  /** 0 = Chủ nhật … 6 = Thứ bảy. */
  weekday: number;
  weekdayLabel: string;
}

function parseIsoDate(s: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const t = Date.UTC(y, mo - 1, d);
  const back = new Date(t);
  if (back.getUTCFullYear() !== y || back.getUTCMonth() !== mo - 1 || back.getUTCDate() !== d) return null;
  return t;
}

export function isValidIsoDate(s: unknown): s is string {
  return typeof s === 'string' && parseIsoDate(s) !== null;
}

export type RangeError =
  | 'START_REQUIRED'
  | 'END_REQUIRED'
  | 'INVALID_DATE'
  | 'END_BEFORE_START'
  | 'TOO_LONG';

export function validateTripRange(start: unknown, end: unknown): { ok: true } | { ok: false; error: RangeError } {
  if (start === undefined || start === null || start === '') return { ok: false, error: 'START_REQUIRED' };
  if (end === undefined || end === null || end === '') return { ok: false, error: 'END_REQUIRED' };
  if (typeof start !== 'string' || typeof end !== 'string') return { ok: false, error: 'INVALID_DATE' };
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (s === null || e === null) return { ok: false, error: 'INVALID_DATE' };
  if (e < s) return { ok: false, error: 'END_BEFORE_START' };
  if ((e - s) / 86_400_000 + 1 > MAX_TRIP_DAYS) return { ok: false, error: 'TOO_LONG' };
  return { ok: true };
}

/** Số ngày lịch, gồm hai đầu (R5). Giả định khoảng đã hợp lệ. */
export function dayCount(start: string, end: string): number {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (s === null || e === null) throw new Error('INVALID_DATE');
  return (e - s) / 86_400_000 + 1;
}

/** Mỗi ngày lịch trong khoảng có một ngày, kèm thứ tính từ ngày (R1). */
export function listDays(start: string, end: string): Day[] {
  const s = parseIsoDate(start);
  const n = dayCount(start, end);
  if (s === null) throw new Error('INVALID_DATE');
  const days: Day[] = [];
  for (let i = 0; i < n; i++) {
    const t = s + i * 86_400_000;
    const dt = new Date(t);
    const weekday = dt.getUTCDay();
    days.push({
      date: dt.toISOString().slice(0, 10),
      index: i + 1,
      weekday,
      weekdayLabel: WEEKDAY_LABELS[weekday] ?? '',
    });
  }
  return days;
}

/** Ngày của các mục nằm ngoài khoảng mới (R12). Khác rỗng ⇒ không cho đổi ngày chuyến. */
export function datesOutsideRange(itemDates: readonly string[], start: string, end: string): string[] {
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  if (s === null || e === null) throw new Error('INVALID_DATE');
  const out = new Set<string>();
  for (const d of itemDates) {
    const t = parseIsoDate(d);
    if (t === null || t < s || t > e) out.add(d);
  }
  return [...out].sort();
}

export function isDateInRange(date: string, start: string, end: string): boolean {
  const t = parseIsoDate(date);
  const s = parseIsoDate(start);
  const e = parseIsoDate(end);
  return t !== null && s !== null && e !== null && t >= s && t <= e;
}
