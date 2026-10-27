import { inclusiveDays } from '../../../shared/lib/dates.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { dayItems, summarizeCosts, tripDays } from './tripMath.ts';

/** Mốc thời gian đẩy mục không có giờ xuống cuối khi xếp theo giờ. */
const NO_TIME = '99:99';

/** Trạng thái của màn "Hôm nay" cho một chuyến (S17). Chuyến chưa chắc ngày thì KHÔNG đoán hôm nay là ngày nào. */
export type TodayState =
  | { readonly kind: 'tentative' }
  | { readonly kind: 'before'; readonly daysLeft: number }
  | { readonly kind: 'after' }
  | { readonly kind: 'empty'; readonly dayNumber: number; readonly day: string }
  | { readonly kind: 'day'; readonly dayNumber: number; readonly day: string; readonly items: readonly TripItem[]; readonly totalK: number; readonly unknownCount: number };

/** Các mục của ngày xếp theo giờ (mục có giờ trước, cùng giờ giữ thứ tự xếp; mục không giờ xuống cuối theo thứ tự xếp). */
export function itemsByTime(items: readonly TripItem[]): TripItem[] {
  return items
    .map((it, index) => ({ it, index }))
    .sort((a, b) => (a.it.timeOfDay ?? NO_TIME).localeCompare(b.it.timeOfDay ?? NO_TIME) || a.index - b.index)
    .map((x) => x.it);
}

/** Trạng thái "Hôm nay" của một chuyến tại ngày `today` (`yyyy-mm-dd`, theo lịch của máy người dùng). */
export function todayView(trip: Trip, today: string): TodayState {
  if (trip.datesTentative) return { kind: 'tentative' };
  if (today < trip.startDate) return { kind: 'before', daysLeft: inclusiveDays(today, trip.startDate) - 1 };
  if (today > trip.endDate) return { kind: 'after' };
  const day = today;
  const dayNumber = tripDays(trip).indexOf(day) + 1;
  const list = dayItems(trip, day);
  if (!list.length) return { kind: 'empty', dayNumber, day };
  const costs = summarizeCosts({ items: list });
  return { kind: 'day', dayNumber, day, items: itemsByTime(list), totalK: costs.totalK, unknownCount: costs.unknownCount };
}

/**
 * Chọn chuyến cho "Hôm nay": đang diễn ra (chắc ngày) → sắp tới gần nhất → vừa kết thúc gần nhất → chuyến đầu danh sách.
 * Không có chuyến thì null.
 */
export function pickTodayTrip(trips: readonly Trip[], today: string): Trip | null {
  const sure = trips.filter((t) => !t.datesTentative);
  const live = sure.find((t) => t.startDate <= today && today <= t.endDate);
  if (live) return live;
  const upcoming = sure.filter((t) => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  if (upcoming) return upcoming;
  const past = sure.filter((t) => t.endDate < today).sort((a, b) => b.endDate.localeCompare(a.endDate))[0];
  return past ?? trips[0] ?? null;
}
