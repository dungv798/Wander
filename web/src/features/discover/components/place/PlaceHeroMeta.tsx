import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { Chip } from '../../../../shared/ui/Chip.tsx';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { mainAway } from '../../model/destinationQueries.ts';

/** Tên và thông tin quyết định nổi ở đáy ảnh; khoảng cách chỉ hiện khi có mốc thật. */
export function PlaceHeroMeta({ place }: { readonly place: PlaceView }) {
  const away = mainAway(place);
  return <div className="place-hero-meta">
    <p>{place.categoryName}{COPY.units.dot}{place.area}</p>
    <h2>{place.name}</h2>
    <div className="chips">
      <Chip tone="glass" icon="clock">{place.duration}</Chip>
      <Chip tone="glass" icon="calendar-event">{place.bestLabel}</Chip>
      {away ? <Chip tone="glass" icon="route">{fill(COPY.units.kmApprox, { km: away.km })}</Chip> : null}
    </div>
  </div>;
}

