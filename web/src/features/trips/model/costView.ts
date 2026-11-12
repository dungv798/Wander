import { KIND_ORDER } from './trip.const.ts';
import type { ItemKind, TripItem } from './trip.types.ts';
import { isPlain } from './tripMath.ts';

/** How costs are grouped in the detail sheet. */
export type CostGrouping = 'day' | 'kind';

/** A group of expense items: the known total, the number of items with an unknown price and the items (to open for editing). */
export interface CostGroup {
  /** A day ('' = no date yet) or a kind code. */
  readonly key: string;
  readonly items: readonly TripItem[];
  /** The total in thousand VND of items with a known price, not counting 'included'. */
  readonly knownK: number;
  readonly knownCount: number;
  readonly unknownCount: number;
  readonly includedCount: number;
}

/** Builds a group from a list of items: empty = unknown, 0 = known to be zero, 'included' is not added (D17/D18). */
function toGroup(key: string, items: readonly TripItem[]): CostGroup {
  let knownK = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let includedCount = 0;
  for (const i of items) {
    if (i.included) includedCount += 1;
    else if (i.costK === null) unknownCount += 1;
    else { knownCount += 1; knownK += i.costK; }
  }
  return { key, items, knownK, knownCount, unknownCount, includedCount };
}

/**
 * Groups the items that can have a price (dropping Rest/To-do) by day or by kind. By day: exactly the trip's day order, 'no date yet' (key '') last.
 * By kind: the fixed order of `KIND_ORDER`. An empty group does not appear.
 */
export function groupCosts(items: readonly TripItem[], by: CostGrouping, days: readonly string[]): CostGroup[] {
  const priced = items.filter((i) => !isPlain(i.type));
  if (by === 'kind') {
    return KIND_ORDER.flatMap((k: ItemKind) => {
      const mine = priced.filter((i) => i.type === k);
      return mine.length ? [toGroup(k, mine)] : [];
    });
  }
  const keys = [...days, ''];
  return keys.flatMap((d) => {
    const mine = priced.filter((i) => (i.day ?? '') === d);
    return mine.length ? [toGroup(d, mine)] : [];
  });
}
