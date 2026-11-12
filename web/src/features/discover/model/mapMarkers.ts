import type { MapMarker } from '../../../shared/map/map.types.ts';
import type { DestinationDetail, PlaceView } from './Catalog.types.ts';
import { firstPhotoUrl } from './destinationQueries.ts';
import { FLUENT_ICONS, FLUENT_PATH, FLUENT_SUFFIX } from '../../../shared/ui/icons/fluentIcons.const.ts';
import { CATEGORY_ICON } from './discover.const.ts';
import type { CategoryCode } from './Catalog.types.ts';

/** Reuses the icon photo of the list/detail; a kind with no sticker still uses the real photo. */
export function categorySticker(category: CategoryCode): string | undefined {
  const icon = FLUENT_ICONS[CATEGORY_ICON[category]];
  return icon ? `${FLUENT_PATH}${icon}${FLUENT_SUFFIX}` : undefined;
}

/** A pin for every place that has coordinates (a round real photo + the name). */
export function placeMarkers(places: readonly PlaceView[]): MapMarker[] {
  return places.filter((p) => p.lat != null && p.lon != null).map((p) => {
    return { id: p.id, lat: p.lat as number, lon: p.lon as number, label: p.name, thumb: firstPhotoUrl(p) };
  });
}

/** A pin numbered 1, 2, 3... for the list of selected places (only places with coordinates). */
export function numberedMarkers(places: readonly PlaceView[]): MapMarker[] {
  return placeMarkers(places).map((m, i) => ({ ...m, num: i + 1 }));
}

/** The main landmark of the destination (for example Ha Giang city) as a `hub` pin; null if the landmark has no coordinates. */
export function hubMarker(dest: DestinationDetail): MapMarker | null {
  const r = dest.references[0];
  return r && r.lat != null && r.lon != null ? { id: 'hub', lat: r.lat, lon: r.lon, label: r.name, kind: 'hub' } : null;
}
