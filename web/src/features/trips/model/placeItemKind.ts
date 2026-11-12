import { PLACE_KIND } from './trip.const.ts';
import type { PlaceRef } from './tripState.ts';
import type { ItemKind } from './trip.types.ts';

/** A coffee shop defaults to a rest stop; a dish/restaurant and lodging keep their own group, with no inference that it is booked. */
export function placeItemKind(place: PlaceRef): ItemKind {
  return place.venue?.kind === 'cafe' || place.venue?.kind === 'bar' ? 'rest' : PLACE_KIND[place.category] ?? 'sightseeing';
}
