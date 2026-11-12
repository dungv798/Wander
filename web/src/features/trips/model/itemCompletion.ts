import type { TripItem } from './trip.types.ts';

/** A place item with a catalog link, not including Rest or To-do even if they carry a link. */
export function isPlaceItem(item: TripItem): boolean {
  return item.placeId !== null && item.type !== 'rest' && item.type !== 'task';
}

/** Matches the done-endpoint rule: a to-do or a place, regardless of who added the item. */
export function canCompleteItem(item: TripItem): boolean {
  return item.type === 'task' || isPlaceItem(item);
}
