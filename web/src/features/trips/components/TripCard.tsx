import { VIEW } from '../../../shared/const/routes.const.ts';
import { dayMonth } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import type { Trip } from '../model/trip.types.ts';
import { countText } from '../model/tripView.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { todayLocal } from '../../../shared/lib/dates.ts';
import { tripStatus } from '../list/tripList.ts';
import { LIST_COPY } from '../list/list.copy.ts';
import { gradientStyle } from '../model/cover.ts';

/** "31/10 – 02/11", kèm "· chưa chắc" khi ngày mới là dự kiến. */
export function dateRangeText(t: Pick<Trip, 'startDate' | 'endDate' | 'datesTentative'>): string {
  const range = `${dayMonth(t.startDate)} – ${dayMonth(t.endDate)}`;
  return t.datesTentative ? `${range} · ${T.list.tentativeTag}` : range;
}

/** Thẻ một chuyến trong danh sách: ảnh bìa (ảnh nơi đầu tiên), tên, ngày, số mục. */
export function TripCard({ trip, cover }: { readonly trip: Trip; readonly cover: string }) {
  const assigned = trip.items.filter(item => item.day !== null).length;
  return (
    <button className="tcard trip-photo-card" type="button" onClick={() => navigate(VIEW.TRIP, trip.id, 'ov')}>
      <div className="cov" data-cover={gradientStyle(trip.cover) ? 'gradient' : 'photo'} style={gradientStyle(trip.cover)}>
        {cover ? <RevealImage alt="" src={cover} loading="lazy" /> : null}
      </div>
      <div className="b">
        <span className="trip-status">{LIST_COPY.status[tripStatus(trip, todayLocal())]}</span>
        <h3 title={trip.name}>{trip.name}</h3>
        <div className="meta">
          <span>
            <Icon name="calendar-event" size="s" /> {dateRangeText(trip)}
          </span>
          <span>{countText(trip)}</span>
          <span><Icon name="list-check" size="s" />{fill(T.list.scheduleProgress, { a: assigned, u: trip.items.length - assigned })}</span>
          {trip.role === 'member' ? <span className="chip tint">{COLLAB_COPY.roles.member}</span> : null}
        </div>
      </div>
    </button>
  );
}

