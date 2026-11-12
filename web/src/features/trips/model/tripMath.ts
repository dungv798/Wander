import { formatVnd } from '../../../shared/domain/Money.ts';
import { FORMAT } from '../../../shared/const/format.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { TRIPS_COPY as T } from './trips.copy.ts';
import { DateRange } from '../../../shared/domain/DateRange.ts';
import { ROAD_FACTOR, airKm, minutesForKm, sumRoundedMinutes } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import { ITEM_KINDS } from './trip.const.ts';
import type { ItemKind, Trip, TripItem } from './trip.types.ts';

/** Every `yyyy-mm-dd` day of the trip, both ends included (R5). */
export function tripDays(t: Pick<Trip, 'startDate' | 'endDate'>): string[] {
  return DateRange.of(t.startDate, t.endDate).days();
}

/** Item kinds with no price and no booking (Rest, To-do). */
export function isPlain(kind: ItemKind): boolean {
  return ITEM_KINDS[kind].plain;
}

/** The items of a day by `position` order (an item with no order goes last, keeping the order added). */
export function dayItems(t: Pick<Trip, 'items'>, day: string): TripItem[] {
  return t.items
    .map((it, index) => ({ it, index }))
    .filter((x) => x.it.day === day)
    .sort((a, b) => (a.it.position ?? Number.MAX_SAFE_INTEGER) - (b.it.position ?? Number.MAX_SAFE_INTEGER) || a.index - b.index)
    .map((x) => x.it);
}

/** The 'No date yet' items. */
export function unassignedItems(t: Pick<Trip, 'items'>): TripItem[] {
  return t.items.filter((i) => i.day === null);
}

/** The cost summary of a trip (D17/D18). Every number is in thousand VND. */
export interface CostSummary {
  /** 'Extra to pay': only adds items with a known price and NOT 'included'. */
  readonly totalK: number;
  readonly knownCount: number;
  /** The number of items that have a price but whose price is unknown (an empty box), not counting 'included' items. */
  readonly unknownCount: number;
  readonly includedCount: number;
  readonly booked: number;
  /** The number of items that can be booked (kinds that have a price). */
  readonly bookable: number;
  readonly byKind: Readonly<Partial<Record<ItemKind, number>>>;
  readonly byDayK: Readonly<Record<string, number>>;
  readonly unknownByDay: Readonly<Record<string, number>>;
}

/** Computes the cost by the rule: empty = unknown; 0 = known to be zero; 'included' is not added; Rest/To-do have no price. */
export function summarizeCosts(t: Pick<Trip, 'items'>): CostSummary {
  let totalK = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let includedCount = 0;
  let booked = 0;
  let bookable = 0;
  const byKind: Partial<Record<ItemKind, number>> = {};
  const byDayK: Record<string, number> = {};
  const unknownByDay: Record<string, number> = {};
  for (const i of t.items) {
    if (isPlain(i.type)) continue;
    bookable += 1;
    if (i.booking === 'booked') booked += 1;
    if (i.included) {
      includedCount += 1;
      continue;
    }
    if (i.costK === null) {
      unknownCount += 1;
      if (i.day) unknownByDay[i.day] = (unknownByDay[i.day] ?? 0) + 1;
      continue;
    }
    knownCount += 1;
    totalK += i.costK;
    byKind[i.type] = (byKind[i.type] ?? 0) + i.costK;
    if (i.day) byDayK[i.day] = (byDayK[i.day] ?? 0) + i.costK;
  }
  return { totalK, knownCount, unknownCount, includedCount, booked, bookable, byKind, byDayK, unknownByDay };
}

/** Compares the budget with 'extra to pay'. */
export interface BudgetStatus {
  readonly budgetK: number;
  readonly leftK: number;
  readonly over: boolean;
  /** The percentage used, clamped to 0..100 (a budget of 0 with spending is 100). */
  readonly pct: number;
}

const PERCENT = 100;

/** The budget state; null if no budget is set. */
export function budgetStatus(budgetK: number | null, totalK: number): BudgetStatus | null {
  if (budgetK === null) return null;
  const leftK = budgetK - totalK;
  const pct = budgetK ? Math.min(PERCENT, Math.round((totalK / budgetK) * PERCENT)) : PERCENT;
  return { budgetK, leftK, over: leftK < 0, pct };
}

/** The estimated distance (km, mountain road = straight line x a factor) accumulated over adjacent items that have coordinates; an item with no coordinates is skipped. */
export function roadKm(items: readonly TripItem[], coordOf: (placeId: string) => GeoPoint | null): number {
  let sum = 0;
  let last: GeoPoint | null = null;
  for (const i of items) {
    const p = i.placeId ? coordOf(i.placeId) : null;
    if (!p) continue;
    if (last) sum += airKm(last, p) * ROAD_FACTOR;
    last = p;
  }
  return sum;
}

/** The total travel time (minutes) = the sum of the legs ALREADY rounded for display, so it always matches each leg in the day. */
export function roadMinutes(items: readonly TripItem[], coordOf: (placeId: string) => GeoPoint | null): number {
  const legs: number[] = [];
  let last: GeoPoint | null = null;
  for (const i of items) {
    const p = i.placeId ? coordOf(i.placeId) : null;
    if (!p) continue;
    if (last) legs.push(minutesForKm(airKm(last, p) * ROAD_FACTOR));
    last = p;
  }
  return sumRoundedMinutes(legs);
}

/** The number of items that are places in the catalog. */
export function placeCount(t: Pick<Trip, 'items'>): number {
  return t.items.filter((i) => i.placeId !== null).length;
}

/** Expresses how complete the pricing is; the number 0 only shows when there is an entered price, not counting included items. */
export function costSummaryText(costs: Pick<CostSummary, 'knownCount' | 'totalK' | 'unknownCount'>): string {
  if (!costs.knownCount) return T.cost.noneKnown;
  const amount = formatVnd(costs.totalK * FORMAT.VND_PER_THOUSAND);
  return fill(costs.unknownCount ? T.cost.partial : T.cost.known, { money: amount, n: costs.unknownCount });
}
