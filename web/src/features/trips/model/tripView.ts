import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { ITEM_KINDS } from './trip.const.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { TRIPS_COPY } from './trips.copy.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';

/** The trip's destination along with a place lookup by id (a place removed from the catalog returns null, the item can still be shown with an empty name). */
export interface TripCatalog {
  readonly dest: DestinationDetail;
  readonly place: (id: string | null) => PlaceView | null;
}

/** Builds the place lookup for a destination. */
export function catalogOf(dest: DestinationDetail): TripCatalog {
  const byId = new Map(dest.places.map((p) => [p.id, p]));
  return { dest, place: (id) => (id ? (byId.get(id) ?? null) : null) };
}

/** The display name of an item: the place name in the catalog, or a self-given name, or the kind label. */
export function itemName(item: TripItem, cat: TripCatalog): string {
  return cat.place(item.placeId)?.name ?? (item.title || ITEM_KINDS[item.type].label);
}

/** The coordinates of a place in the catalog (null if none yet). */
export function coordOf(cat: TripCatalog): (placeId: string) => GeoPoint | null {
  return (id) => {
    const p = cat.place(id);
    return p && p.lat !== null && p.lon !== null ? { lat: p.lat, lon: p.lon } : null;
  };
}

/** The line 'n places - m other items' of a trip. */
export function countText(t: Pick<Trip, 'items'>): string {
  const places = t.items.filter((i) => i.placeId).length;
  const other = t.items.length - places;
  return other ? fill(TRIPS_COPY.list.countOther, { n: places, o: other }) : fill(TRIPS_COPY.list.count, { n: places });
}

/** The destination's main landmark (the first landmark that has coordinates), so day-scheduling suggestions start from it. */
export function hubPoint(dest: DestinationDetail): GeoPoint | null {
  const r = dest.references[0];
  return r && r.lat !== undefined && r.lon !== undefined ? { lat: r.lat, lon: r.lon } : null;
}


