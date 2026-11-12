import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { formatTravelTime } from '../../../shared/lib/geo.ts';
import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';
import type { PlaceView } from './Catalog.types.ts';
import { mainAway } from './destinationQueries.ts';
import { isTrek } from './trekking.ts';
import { DISCOVER_COPY as C } from './discover.copy.ts';

/** One quick-fact cell of the detail sheet: an icon, a label and a value. */
export interface PlaceFact {
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
}

/**
 * The four quick facts of a place. An ordinary place: the visit time, the difficulty, the distance and the estimated motorbike time from the landmark.
 * Hiking/trekking: NO motorbike time (the time to the summit is not inferred) and the distance is only a 'reference point'; the last cell says plainly that there is no route data.
 */
export function placeFacts(place: PlaceView): readonly PlaceFact[] {
  const away = mainAway(place);
  const km = away ? fill(COPY.units.kmApprox, { km: away.km }) : COPY.units.noValue;
  if (place.venue) return [
    { icon: place.venue.kind === 'cafe' ? 'building-store' : place.venue.kind === 'lodging' ? 'bed' : 'tools-kitchen-2', label: C.venue.type, value: place.venue.kindName },
    { icon: 'coin', label: C.venue.price, value: place.venue.priceNote || C.venue.priceUnknown },
    { icon: 'clock', label: place.venue.kind === 'lodging' ? C.venue.checkIn : C.venue.hours, value: place.venue.serviceHours || C.venue.hoursUnknown },
    { icon: 'route', label: fill(COPY.place.factAway, { ref: away?.refName ?? '' }), value: km },
  ];
  const base: PlaceFact[] = [
    { icon: 'clock', label: COPY.place.factDuration, value: place.duration },
    { icon: 'gauge', label: COPY.place.factLevel, value: place.difficulty },
  ];
  if (isTrek(place)) {
    return [
      ...base,
      { icon: 'route', label: away ? fill(COPY.place.trekRefFact, { ref: away.refName }) : COPY.place.trekRouteFact, value: km },
      { icon: 'mountain', label: COPY.place.trekRouteFact, value: COPY.place.trekNoRoute },
    ];
  }
  return [
    ...base,
    { icon: 'route', label: fill(COPY.place.factAway, { ref: away?.refName ?? '' }), value: km },
    { icon: 'motorbike', label: COPY.place.factMoto, value: away ? formatTravelTime(away.minutes) : COPY.units.noValue },
  ];
}
