import type { MapMarker, MapRoute } from '../../../shared/map/map.types.ts';
import { onboardPhotoUrl } from './onboardPhotos.ts';
import type { TripDay, TripItem, TripStop } from './onboarding.types.ts';

/** The items that are places (with a pin) of a day. */
export function stopsOf(day: TripDay): TripStop[] {
  return day.items.flatMap((item) => (item.kind === 'stop' ? [item] : []));
}

/** The number of places revealed when the new list shows the first `rows` rows (a break does not count). */
export function stopsRevealed(items: readonly TripItem[], rows: number): number {
  return items.slice(0, rows).filter((i) => i.kind === 'stop').length;
}

/** The pins of a day: a revealed place has a photo and a number matching the list, a place not yet its turn is a small faded dot (so the camera still fits the whole day). */
export function dayMarkers(day: TripDay, revealed: number): MapMarker[] {
  return stopsOf(day).map((s) => {
    const base = { id: s.place.id, lat: s.place.lat as number, lon: s.place.lon as number, thumb: onboardPhotoUrl(s.place) };
    return s.num <= revealed ? { ...base, label: s.place.name, num: s.num } : { ...base, muted: true };
  });
}

/** The overview pins of the whole trip: round photos, not numbered (a number only has meaning within one day). */
export function overviewMarkers(days: readonly TripDay[]): MapMarker[] {
  return days.flatMap((d) => stopsOf(d).map((s) => ({ id: s.place.id, lat: s.place.lat as number, lon: s.place.lon as number, thumb: onboardPhotoUrl(s.place) })));
}

/** The connecting line in the order of visits of a day, shown only when all the pins are revealed (and only then drawn). No km label. */
export function dayRoute(day: TripDay, revealed: number): MapRoute | null {
  const ids = stopsOf(day).map((s) => s.place.id);
  return ids.length > 1 && revealed >= ids.length ? { ids, labels: [], viewKey: `onboard-day-${day.index}` } : null;
}

/** The ids of the places of a day (to fit the camera frame), or null = the whole trip. */
export function fitIds(day: TripDay | null): string[] | null {
  return day ? stopsOf(day).map((s) => s.place.id) : null;
}
