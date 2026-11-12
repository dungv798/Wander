import { airKm } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { CoordinateOf } from './planDays.types.ts';
import type { TripItem } from './trip.types.ts';
import { itemPoint } from './planPolicy.ts';

/** The next-nearest order, caching coordinates once; not an algorithm that optimizes a real route. */
export function visitOrder(items: readonly TripItem[], coordinateOf: CoordinateOf, hub: GeoPoint | null): TripItem[] {
  const pool = items.map(item => ({ item, point: itemPoint(item, coordinateOf) }));
  const order: TripItem[] = [];
  let current = hub;
  while (pool.length) {
    let best = 0;
    let distance = Number.POSITIVE_INFINITY;
    pool.forEach((entry, index) => {
      const nextDistance = current && entry.point ? airKm(current, entry.point) : 0;
      if (nextDistance < distance) { best = index; distance = nextDistance; }
    });
    const next = pool.splice(best, 1)[0]!;
    order.push(next.item);
    current = next.point;
  }
  return order;
}
