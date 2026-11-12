import { todayLocal } from '../../../shared/lib/dates.ts';
import { todayView } from '../model/todayView.ts';
import type { Trip, TripItem } from '../model/trip.types.ts';
import { canCompleteItem, isPlaceItem } from '../model/itemCompletion.ts';

/** Keeps the schedule per device like the old screen; a simulated day takes priority, a trip has no separate time-zone field yet. */
export function todayState(trip: Trip, now: Date, simulatedDay = '') {
  return todayView(trip, simulatedDay || todayLocal(now));
}

/** Chooses the first unfinished item by the existing time order; it does not infer arrival because the time has passed. */
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

/** Counts visits per item for the person viewing; the same place in two items is still two independent visits. */
export function visitedCount(items: readonly TripItem[]): number {
  return items.filter((item) => isPlaceItem(item) && item.done).length;
}

/** The real ratio from the list of visible items passed in: the day being viewed or the whole trip, not including the trash. */
export function visitedProgress(items: readonly TripItem[]) {
  return { visited: visitedCount(items), total: items.filter(isPlaceItem).length };
}
