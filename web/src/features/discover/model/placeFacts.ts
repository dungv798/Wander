import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { formatTravelTime } from '../../../shared/lib/geo.ts';
import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';
import type { PlaceView } from './Catalog.types.ts';
import { mainAway } from './destinationQueries.ts';
import { isTrek } from './trekking.ts';
import { DISCOVER_COPY as C } from './discover.copy.ts';

/** Một ô thông số nhanh của tờ chi tiết: biểu tượng, nhãn và giá trị. */
export interface PlaceFact {
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
}

/**
 * Bốn thông số nhanh của một nơi. Nơi thường: thời gian ghé, độ khó, khoảng cách và thời gian xe máy ước tính từ mốc.
 * Leo núi/trekking: KHÔNG có thời gian xe máy (không suy ra giờ lên đỉnh) và khoảng cách chỉ là "điểm tham chiếu"; ô cuối nói thẳng chưa có dữ liệu tuyến.
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
