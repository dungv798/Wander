import type { PlaceView } from './Catalog.types.ts';

/** The code of the 'Hiking / trekking' kind of the editorial catalog (shared by the chip, the icon and the display rules). */
export const TREK_CATEGORY = 'leo';

/**
 * A place of the hiking/trekking kind. For this kind 'how far' is only a REFERENCE distance from a landmark to the position,
 * and must not be presented as a hiking route, a time to the summit or a motorbike time (there is no GPX/route in the catalog).
 */
export function isTrek(place: Pick<PlaceView, 'category'>): boolean {
  return place.category === TREK_CATEGORY;
}
