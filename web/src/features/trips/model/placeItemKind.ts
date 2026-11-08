import { PLACE_KIND } from './trip.const.ts';
import type { PlaceRef } from './tripState.ts';
import type { ItemKind } from './trip.types.ts';

/** Quán cà phê mặc định là nghỉ chân; món/quán ăn và chỗ ở giữ đúng nhóm, không suy ra đã đặt. */
export function placeItemKind(place: PlaceRef): ItemKind {
  return place.venue?.kind === 'cafe' || place.venue?.kind === 'bar' ? 'rest' : PLACE_KIND[place.category] ?? 'sightseeing';
}
