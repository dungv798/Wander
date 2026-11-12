import { inclusiveDays } from '../../../shared/lib/dates.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { dayItems, summarizeCosts, tripDays } from './tripMath.ts';

/** The time mark that pushes an item with no time to the end when sorting by time. */
const NO_TIME = '99:99';

/** The state of the 'Today' screen for one trip (S17). A trip with tentative dates does NOT guess which day is today. */
export type TodayState =
  | { readonly kind: 'tentative' }
  | { readonly kind: 'before'; readonly daysLeft: number }
  | { readonly kind: 'after' }
  | { readonly kind: 'empty'; readonly dayNumber: number; readonly day: string }
  | { readonly kind: 'day'; readonly dayNumber: number; readonly day: string; readonly items: readonly TripItem[]; readonly totalK: number; readonly unknownCount: number };

/** The items of a day sorted by time (items with a time first, same time keeps the schedule order; items with no time go to the end in the schedule order). */
export function itemsByTime(items: readonly TripItem[]): TripItem[] {
  return items
    .map((it, index) => ({ it, index }))
    .sort((a, b) => (a.it.timeOfDay ?? NO_TIME).localeCompare(b.it.timeOfDay ?? NO_TIME) || a.index - b.index)
    .map((x) => x.it);
}

/** The 'Today' state of one trip on day `today` (`yyyy-mm-dd`, by the user's device calendar). */
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
 * Chooses the trip for 'Today': in progress (confirmed dates) -> the nearest upcoming -> the most recently ended -> the first trip in the list.
 * No trip returns null.
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
