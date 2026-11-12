import { LIMITS } from '../../../shared/const/limits.const.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import type { TrashEntry, Trip } from './trip.types.ts';

/** The trash is full (old items are not deleted automatically: kept until the user deletes them permanently, D19). */
export function trashFull(t: Pick<Trip, 'trash'>): boolean {
  return t.trash.length >= LIMITS.MAX_TRASH;
}

/** Restoring this item would create a second copy of a place already in the trip (each place only once). */
export function isDuplicateRestore(t: Pick<Trip, 'items'>, entry: TrashEntry): boolean {
  return entry.item.placeId !== null && t.items.some((i) => i.placeId === entry.item.placeId);
}

export { agoText };
