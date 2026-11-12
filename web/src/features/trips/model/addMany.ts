import { normalizeSearch } from '../../../shared/lib/text.ts';
import type { PlaceRef } from './tripState.ts';
import type { Trip } from './trip.types.ts';
import { tripDays } from './tripMath.ts';

/** Drops places already in the trip and repeated ids in the input; does not change the order the user chose. */
export function missingPlaces<T extends PlaceRef>(places: readonly T[], trip: Pick<Trip, 'items'>): T[] {
  const seen = new Set(trip.items.map(i => i.placeId));
  return places.filter(place => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

/** Toggles the unique selection by id, keeping the selection when the search box or the kind chip changes. */
export function togglePlace(chosen: readonly string[], id: string): string[] {
  return chosen.includes(id) ? chosen.filter(value => value !== id) : [...chosen, id];
}

/** A null day is unscheduled; a specific day must still belong to the trip's date range at send time. */
export function validAddDay(trip: Pick<Trip, 'startDate' | 'endDate'>, day: string | null): boolean {
  return day === null || tripDays(trip).includes(day);
}

/** Accent-insensitive search and kind filter among the places that are not there yet, without affecting the selection set. */
export function filterAddPlaces<T extends PlaceRef>(places: readonly T[], query: string, category: string | null): T[] {
  const text = normalizeSearch(query);
  return places.filter(place => (!category || place.category === category) && normalizeSearch(place.name ?? place.id).includes(text));
}
