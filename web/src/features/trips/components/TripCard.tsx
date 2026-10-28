import { VIEW } from '../../../shared/const/routes.const.ts';
import { dayMonth } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { Trip } from '../model/trip.types.ts';
import { countText } from '../model/tripView.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** "31/10 – 02/11", kèm "· chưa chắc" khi ngày mới là dự kiến. */
export function dateRangeText(t: Pick<Trip, 'startDate' | 'endDate' | 'datesTentative'>): string {
  const range = `${dayMonth(t.startDate)} – ${dayMonth(t.endDate)}`;
  return t.datesTentative ? `${range} · ${T.list.tentativeTag}` : range;
}

/** Thẻ một chuyến trong danh sách: ảnh bìa (ảnh nơi đầu tiên), tên, ngày, số mục. */
export function TripCard({ trip, cover }: { readonly trip: Trip; readonly cover: string }) {
  return (
    <button className="tcard" type="button" onClick={() => navigate(VIEW.TRIP, trip.id, 'ov')}>
      <div className="cov">
        {cover ? <img alt="" src={cover} /> : null}
      </div>
      <div className="b">
        <h3>{trip.name}</h3>
        <div className="meta">
          <span>
            <Icon name="calendar-event" size="s" /> {dateRangeText(trip)}
          </span>
          <span>{countText(trip)}</span>
          {trip.role === 'member' ? <span className="chip tint">{COLLAB_COPY.roles.member}</span> : null}
        </div>
      </div>
    </button>
  );
}

