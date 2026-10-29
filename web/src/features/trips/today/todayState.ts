import { todayLocal } from '../../../shared/lib/dates.ts';
import { todayView } from '../model/todayView.ts';
import type { Trip, TripItem } from '../model/trip.types.ts';

/** Giữ lịch theo thiết bị như màn cũ; ngày giả lập được ưu tiên, chuyến chưa có trường múi giờ riêng. */
export function todayState(trip: Trip, now: Date, simulatedDay = '') {
  return todayView(trip, simulatedDay || todayLocal(now));
}

/** Chọn mục chưa xong đầu tiên theo thứ tự giờ hiện có; không suy đoán đã tới nơi vì đã quá giờ. */
export function nextStop(items: readonly TripItem[]) {
  const next = items.find((item) => !item.done) ?? null;
  const index = next ? items.indexOf(next) : -1;
  return {
    next,
    previous: index > 0 ? items[index - 1] ?? null : null,
    remaining: items.filter((item) => !item.done && item.id !== next?.id),
    completed: items.filter((item) => item.done),
  };
}

/** Chỉ đếm địa điểm có bằng chứng hoàn thành; một địa điểm lặp nhiều ngày chỉ được tính một lần. */
export function visitedCount(items: readonly TripItem[]): number {
  return new Set(items.filter((item) => item.placeId && item.done).map((item) => item.placeId)).size;
}
