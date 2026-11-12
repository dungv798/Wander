import type { CategoryCode, DestinationDetail, PhotoView, PlaceView } from './Catalog.types.ts';

/** The best months of a destination: taken from the 'months' guide block (not hard-coded in the UI). */
export function destBestMonths(d: DestinationDetail): readonly number[] {
  return d.guide.find((g) => g.layout === 'months')?.bestMonths ?? [];
}

/** The rainy months of a destination, from the same 'months' block. */
export function destRainyMonths(d: DestinationDetail): readonly number[] {
  return d.guide.find((g) => g.layout === 'months')?.rainyMonths ?? [];
}

/** A place by id; null if there is none (no other place is guessed). */
export function placeById(d: DestinationDetail, id: string): PlaceView | null {
  return d.places.find((p) => p.id === id) ?? null;
}

/** The first photo of a place; an empty string if there is no curated photo yet (DR-033). */
export function firstPhotoUrl(p: PlaceView | null | undefined): string {
  return p?.photos[0]?.url ?? '';
}

/** Image to show in a small list or card slot: the 480 px variant when the photo has one, else the main image. */
export function thumbOrUrl(photo: PhotoView | null | undefined): string {
  return photo?.thumbUrl ?? photo?.url ?? '';
}

/** Thumbnail of the first photo of a place for list rows and cards; empty string when there is no photo. */
export function firstPhotoThumbUrl(p: PlaceView | null | undefined): string {
  return thumbOrUrl(p?.photos[0]);
}

/** The `i`-th photo of a place, clamped to the valid range. */
export function photoAt(p: PlaceView, i: number): PhotoView | undefined {
  return p.photos[Math.max(0, Math.min(p.photos.length - 1, i))];
}

/** The places that are in their good season in a month (1-12), per the editorial catalog. */
export function placesInSeason(d: DestinationDetail, month: number): PlaceView[] {
  return d.places.filter((p) => p.bestMonths.includes(month));
}

/** The kinds present in the destination in order of first appearance. */
export function categoriesOf(d: DestinationDetail): CategoryCode[] {
  return [...new Set(d.places.map((p) => p.category))];
}

/** Groups places by kind, keeping the order in which the kind first appears. */
export function groupByCategory(d: DestinationDetail): Map<CategoryCode, PlaceView[]> {
  const out = new Map<CategoryCode, PlaceView[]>();
  d.places.forEach((p) => out.set(p.category, [...(out.get(p.category) ?? []), p]));
  return out;
}

/** The estimated distance of a place to the main landmark (the first landmark), or null if the place has no coordinates yet. */
export function mainAway(p: PlaceView): PlaceView['away'][number] | null {
  return p.away[0] ?? null;
}

/** The cover place of a destination: the place whose first photo equals the cover photo (the backend returns only `coverUrl`, not the id of the cover place). */
export function coverPlace(d: DestinationDetail): PlaceView | null {
  return d.places.find((p) => firstPhotoUrl(p) === d.coverUrl) ?? d.places[0] ?? null;
}
