import { TRIP_TIME as C } from './tripTime.const.ts';

/** Nhận HH:mm hoặc bốn chữ số; chuỗi rỗng xóa giờ, sai trả null để chặn lưu. */
export function normalizeTripTime(raw: string): string | null {
  const text = raw.trim();
  if (!text) return '';
  const match = /^(\d{2}):?(\d{2})$/.exec(text);
  if (!match || Number(match[1]) >= C.HOURS || Number(match[2]) >= C.MINUTES) return null;
  return `${match[1]}:${match[2]}`;
}

/** Tạo lựa chọn có số 0 đầu, dùng cùng quy tắc cho giờ và phút. */
export function timeOptions(count: number, step = 1): string[] {
  return Array.from({ length: count / step }, (_, i) => String(i * step).padStart(C.PART_DIGITS, '0'));
}
