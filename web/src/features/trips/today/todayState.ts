import { todayLocal } from '../../../shared/lib/dates.ts';
import { todayView } from '../model/todayView.ts';
import type { Trip, TripItem } from '../model/trip.types.ts';
import { canCompleteItem, isPlaceItem } from '../model/itemCompletion.ts';

/** Giữ lịch theo thiết bị như màn cũ; ngày giả lập được ưu tiên, chuyến chưa có trường múi giờ riêng. */
export function todayState(trip: Trip, now: Date, simulatedDay = '') {
  return todayView(trip, simulatedDay || todayLocal(now));
}

/** Chọn mục chưa xong đầu tiên theo thứ tự giờ hiện có; không suy đoán đã tới nơi vì đã quá giờ. */
export function nextStop(items: readonly TripItem[]) {
  const next = items.find((item) => canCompleteItem(item) && !item.done) ?? null;
  const index = next ? items.indexOf(next) : -1;
  return {
    next,
    previous: index > 0 ? items[index - 1] ?? null : null,
    remaining: items.filter((item) => (!canCompleteItem(item) || !item.done) && item.id !== next?.id),
    completed: items.filter((item) => canCompleteItem(item) && item.done),
  };
}

/** Đếm lượt ghé theo từng mục của người đang xem; cùng một nơi trong hai mục vẫn là hai lượt độc lập. */
export function visitedCount(items: readonly TripItem[]): number {
  return items.filter((item) => isPlaceItem(item) && item.done).length;
}

/** Tỷ lệ thật từ danh sách mục còn hiện được truyền vào: ngày đang xem hoặc toàn chuyến, không gồm thùng rác. */
export function visitedProgress(items: readonly TripItem[]) {
  return { visited: visitedCount(items), total: items.filter(isPlaceItem).length };
}
