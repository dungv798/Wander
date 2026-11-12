import type { PlaceView } from '../../discover/index.ts';
import { PROPOSAL, SAMPLE_TRIP } from './onboarding.const.ts';
import type { SlotKey, TripBreak, TripDay, TripItem, TripStop } from './onboarding.types.ts';

const LUNCH_SLOT: SlotKey = 'noon';

/** Looks a place up by id in the destination's catalog; null if there is none. */
export type PlaceLookup = (id: string) => PlaceView | null;

/** Renumbers 1, 2, 3... the places of a day (a break has no number) so the pin number always matches the number in the list. */
function renumber(items: readonly TripItem[]): TripItem[] {
  let n = 0;
  return items.map((item) => (item.kind === 'stop' ? { ...item, num: ++n } : item));
}

/** Builds the sample itinerary from the destination's real data; a place missing from the catalog or lacking coordinates is skipped (it is not replaced by another place). */
export function buildTrip(find: PlaceLookup): TripDay[] {
  return SAMPLE_TRIP.map((day, index) => {
    const items: TripItem[] = day.items.flatMap((entry): TripItem[] => {
      if (entry === 'lunch') return [{ kind: 'break', slot: LUNCH_SLOT } satisfies TripBreak];
      const place = find(entry.placeId);
      if (!place || place.lat === null || place.lon === null) return [];
      return [{ kind: 'stop', place, slot: entry.slot, note: entry.note, num: 0, proposedBy: null } satisfies TripStop];
    });
    return { index, theme: day.theme, items: renumber(items) };
  });
}

/** The places (with a pin) of a day in visiting order. */
export function dayPlaces(day: TripDay): PlaceView[] {
  return day.items.flatMap((item) => (item.kind === 'stop' ? [item.place] : []));
}

/** Which day (day index) a place is in the itinerary, or -1 if it is not there. */
export function dayOfPlace(days: readonly TripDay[], placeId: string): number {
  return days.findIndex((d) => d.items.some((i) => i.kind === 'stop' && i.place.id === placeId));
}

/** The trip owner accepts the suggestion: puts the place at the start of the suggested day and renumbers; no copy is made if the place is already in the itinerary. */
export function applyProposal(days: readonly TripDay[], place: PlaceView): TripDay[] {
  if (dayOfPlace(days, place.id) >= 0) return [...days];
  return days.map((day) => {
    if (day.index !== PROPOSAL.dayIndex) return day;
    const added: TripStop = { kind: 'stop', place, slot: PROPOSAL.slot, note: '', num: 0, proposedBy: PROPOSAL.by };
    return { ...day, items: renumber([added, ...day.items]) };
  });
}
