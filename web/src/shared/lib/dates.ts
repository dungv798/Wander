import { FORMAT } from '../const/format.const.ts';

const DAYS_IN_WEEK = 7;
const ISO_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_OF_MONTH_START = 8;
const MONTH_START = 5;
const YEAR_END = 4;

/** Đọc chuỗi ngày `yyyy-mm-dd` thành mốc UTC nửa đêm; trả null khi sai định dạng hoặc ngày không có thật (ví dụ 2026-02-30). */
export function parseIsoDate(iso: string): Date | null {
  const m = ISO_PATTERN.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return toIsoDate(d) === iso ? d : null;
}

/** Đổi mốc UTC sang chuỗi `yyyy-mm-dd` (ngày lịch, không phụ thuộc múi giờ máy). */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 'yyyy-mm-dd'.length);
}

/** Cộng (hoặc trừ) số ngày lịch vào một ngày `yyyy-mm-dd`. */
export function addDays(iso: string, n: number): string {
  const d = parseIsoDate(iso);
  if (!d) throw new RangeError(`Ngày không hợp lệ: ${iso}`);
  d.setUTCDate(d.getUTCDate() + n);
  return toIsoDate(d);
}

/** Số ngày lịch từ `a` đến `b`, tính cả hai đầu (R5: chuyến 29/08–06/09 là 9 ngày). */
export function inclusiveDays(a: string, b: string): number {
  const da = parseIsoDate(a);
  const db = parseIsoDate(b);
  if (!da || !db) throw new RangeError('Ngày không hợp lệ');
  return Math.round((db.getTime() - da.getTime()) / FORMAT.MS_PER_DAY) + 1;
}

/** "dd/mm" của một ngày `yyyy-mm-dd`. */
export function dayMonth(iso: string): string {
  return `${iso.slice(DAY_OF_MONTH_START)}/${iso.slice(MONTH_START, DAY_OF_MONTH_START - 1)}`;
}

/** Nhãn ngắn kiểu "T7 31/10" (thứ theo ngày lịch UTC). */
export function dayLabel(iso: string): string {
  const d = parseIsoDate(iso);
  return d ? `${FORMAT.WEEKDAYS[d.getUTCDay()] ?? ''} ${dayMonth(iso)}` : '';
}

/** Nhãn đầy đủ kiểu "T7, 31/10/2026"; chuỗi rỗng khi không có ngày. */
export function fullDate(iso: string | null | undefined): string {
  const d = iso ? parseIsoDate(iso) : null;
  if (!iso || !d) return '';
  return `${FORMAT.WEEKDAYS[d.getUTCDay()] ?? ''}, ${dayMonth(iso)}/${iso.slice(0, YEAR_END)}`;
}

/** Hôm nay theo lịch của máy người dùng, dạng `yyyy-mm-dd` (Tầng B: "hôm nay" theo múi giờ thiết bị). */
export function todayLocal(now: Date = new Date()): string {
  return toIsoDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** Ngày gần nhất SAU `from` (không tính `from`) rơi vào thứ `weekday` (0 = Chủ nhật … 6 = Thứ bảy), dạng `yyyy-mm-dd`. Dùng để gợi ý "thứ Bảy tới". */
export function nextWeekday(from: string, weekday: number): string {
  const d = parseIsoDate(from);
  if (!d) throw new RangeError(`Ngày không hợp lệ: ${from}`);
  const diff = (weekday - d.getUTCDay() + DAYS_IN_WEEK) % DAYS_IN_WEEK || DAYS_IN_WEEK;
  return addDays(from, diff);
}
