import type { PlaceView } from '../../discover/index.ts';
import { DESTINATION_PHOTOS, PLACE_PHOTO_INDEX } from './onboarding.const.ts';

/** The photo used for a place in the intro: the editorial photo chosen as the sharpest and most vivid (by `PLACE_PHOTO_INDEX`), by default the first photo. An empty string if the place has no photo. */
export function onboardPhotoUrl(place: PlaceView): string {
  const wanted = PLACE_PHOTO_INDEX[place.id];
  return (wanted === undefined ? undefined : place.photos[wanted]?.url) ?? place.photos[0]?.url ?? '';
}

/** The photo and focal point of a destination card: a separately chosen photo if there is one, otherwise the catalog's cover photo. */
export function destinationPhoto(id: string, coverUrl: string): { readonly url: string; readonly position: string } {
  const chosen = DESTINATION_PHOTOS[id];
  return chosen ? { url: chosen.url, position: chosen.position } : { url: coverUrl, position: 'center' };
}
