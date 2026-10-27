import { dayLabel } from '../../../shared/lib/dates.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { isPlain, summarizeCosts, tripDays, dayItems } from './tripMath.ts';
import { itemsByTime } from './todayView.ts';

/** Ba kiểu lưu/gửi lịch trình (S18). Bản này chỉ XEM TRƯỚC; chưa tạo tệp. */
export type ExportKind = 'image' | 'pdf' | 'calendar';

/** Tên hiển thị của một mục (địa điểm lấy tên từ kho). */
export type NameOf = (item: TripItem) => string;

/** Thẻ theo ngày của kiểu Ảnh. */
export interface ImageCard {
  readonly dayNumber: number;
  readonly label: string;
  readonly names: readonly string[];
}

/** Ô chi phí trong bảng PDF theo D17/D18: biết giá · đã bao gồm (không cộng) · chưa biết giá · không có giá (Nghỉ/Việc cần làm). */
export type CostCell = { readonly kind: 'known'; readonly k: number } | { readonly kind: 'included' } | { readonly kind: 'unknown' } | { readonly kind: 'none' };

/** Một dòng của bảng PDF. */
export interface PdfRow {
  readonly dayNumber: number;
  readonly dayLabel: string;
  readonly time: string | null;
  readonly name: string;
  readonly cost: CostCell;
}

/** Bảng PDF: các dòng, tổng chỉ cộng mục đã biết giá và số mục chưa biết giá. */
export interface PdfTable {
  readonly rows: readonly PdfRow[];
  readonly totalK: number;
  readonly unknownCount: number;
}

/** Một sự kiện của kiểu Lịch: mục không có giờ là sự kiện cả ngày (múi giờ do thiết bị quyết định). */
export interface CalendarEvent {
  readonly date: string;
  readonly time: string | null;
  readonly durationMin: number | null;
  readonly title: string;
}

/** Mọi mục đã có ngày, theo ngày và giờ (mục "Chưa có ngày" không xuất: chưa biết xếp vào đâu). */
function datedByDay(trip: Trip): readonly { readonly day: string; readonly dayNumber: number; readonly items: readonly TripItem[] }[] {
  return tripDays(trip).map((day, i) => ({ day, dayNumber: i + 1, items: itemsByTime(dayItems(trip, day)) }));
}

/** Nhãn ngày thật của một ngày; chuyến "chưa chắc ngày" có ngày giả (ngày đi + số ngày) nên KHÔNG hiện ngày tháng (trả chuỗi rỗng). */
function realDate(trip: Pick<Trip, 'datesTentative'>, day: string): string {
  return trip.datesTentative ? '' : dayLabel(day);
}

/** Số mục "Chưa có ngày" (không nằm trong bản xuất; xem trước phải nói rõ). */
export function undatedCount(trip: Pick<Trip, 'items'>): number {
  return trip.items.filter((i) => i.day === null).length;
}

/** Thẻ theo ngày (kiểu Ảnh). Ngày không có mục vẫn có thẻ (danh sách rỗng). */
export function imageCards(trip: Trip, nameOf: NameOf): ImageCard[] {
  return datedByDay(trip).map((d) => ({ dayNumber: d.dayNumber, label: realDate(trip, d.day), names: d.items.map(nameOf) }));
}

/** Ô chi phí của một mục theo D17/D18. */
export function costCell(item: TripItem): CostCell {
  if (isPlain(item.type)) return { kind: 'none' };
  if (item.included) return { kind: 'included' };
  return item.costK === null ? { kind: 'unknown' } : { kind: 'known', k: item.costK };
}

/** Bảng PDF: ngày/giờ/mục/chi phí; tổng chỉ cộng mục đã biết giá (cùng quy tắc với hộp Chi phí). */
export function pdfTable(trip: Trip, nameOf: NameOf): PdfTable {
  const rows = datedByDay(trip).flatMap((d) => d.items.map((i) => ({ dayNumber: d.dayNumber, dayLabel: realDate(trip, d.day), time: i.timeOfDay, name: nameOf(i), cost: costCell(i) })));
  const dated = trip.items.filter((i) => i.day !== null);
  const sum = summarizeCosts({ items: dated });
  return { rows, totalK: sum.totalK, unknownCount: sum.unknownCount };
}

/** Sự kiện cho kiểu Lịch: mỗi mục đã có ngày một sự kiện; không giờ = cả ngày. */
export function calendarEvents(trip: Trip, nameOf: NameOf): CalendarEvent[] {
  if (trip.datesTentative) return [];
  return datedByDay(trip).flatMap((d) => d.items.map((i) => ({ date: d.day, time: i.timeOfDay, durationMin: i.durationMin, title: nameOf(i) })));
}
