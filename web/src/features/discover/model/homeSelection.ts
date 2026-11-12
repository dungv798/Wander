import type { Trip } from '../../trips/index.ts';
import type { DestinationDetail } from './Catalog.types.ts';
import { HERO_PHOTOS } from './heroPhotos.const.ts';

/** Takes only photos that were scored and are still in the catalog; with no passing photo the cover photo is kept. */
export function heroImages(dest: DestinationDetail): readonly string[] {
  const photos = dest.places.flatMap(p => p.photos);
  const selected = (HERO_PHOTOS[dest.id] ?? []).flatMap(file => {
    const photo = photos.find(p => p.url.endsWith(`/${file}`));
    return photo ? [photo.url] : [];
  });
  return selected.length ? selected : dest.coverUrl ? [dest.coverUrl] : [];
}

/** Prefers the trip in progress, then the nearest upcoming trip, and finally the most recent draft. */
export function homeTrip(trips: readonly Trip[], today: string): Trip | null {
  const dated = trips.filter(t => !t.datesTentative);
  return dated.find(t => t.startDate <= today && t.endDate >= today)
    ?? [...dated].filter(t => t.startDate > today).sort((a, b) => a.startDate.localeCompare(b.startDate))[0]
    ?? [...trips].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null;
}

/** Only one continue branch is shown; an existing trip always takes priority over places half-chosen. */
export function resumeKind(hasTrip: boolean, pickedCount: number): 'trip' | 'picked' | null {
  return hasTrip ? 'trip' : pickedCount > 0 ? 'picked' : null;
}
