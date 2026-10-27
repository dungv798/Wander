import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { dayLabel, todayLocal } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { CATEGORY_ICON, DestinationGate } from '../../discover/index.ts';
import { useFire } from '../hooks/useFire.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { ITEM_KINDS } from '../model/trip.const.ts';
import type { Trip, TripItem } from '../model/trip.types.ts';
import { pickTodayTrip, todayView } from '../model/todayView.ts';
import type { TodayState } from '../model/todayView.ts';
import { catalogOf, itemName } from '../model/tripView.ts';
import type { TripCatalog } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';

const MINUTE_MS = 60_000;

/** Liên kết "Mở bản đồ" tới một địa điểm có tọa độ, mở ứng dụng bản đồ bên ngoài (người dùng chủ động bấm). Không có tọa độ thì không hiện. */
function MapLink({ name, lat, lon }: { readonly name: string; readonly lat: number; readonly lon: number }) {
  return (
    <a className="btn ghost maplink" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`} target="_blank" rel="noopener noreferrer" aria-label={fill(T.today.mapAria, { name })}>
      <Icon name="map-pin" size="s" />
      {T.today.map}
    </a>
  );
}

/** Một mục của hôm nay: giờ (hoặc "Cả ngày"), tên, loại; việc cần làm tích xong được; địa điểm có liên kết mở bản đồ. */
function TodayItem({ trip, item, cat }: { readonly trip: Trip; readonly item: TripItem; readonly cat: TripCatalog }) {
  const { actions } = useTrips();
  const fire = useFire();
  const place = cat.place(item.placeId);
  const name = itemName(item, cat);
  const kind = ITEM_KINDS[item.type];
  return (
    <li className={`todayrow ${item.done ? 'done' : ''}`}>
      <span className="tdtime">{item.timeOfDay ?? T.today.noTime}</span>
      <span className="tdbody">
        <b>
          <Icon name={place ? CATEGORY_ICON[place.category] : kind.icon} size="s" />
          {name}
        </b>
        <span className="note">{place ? `${place.categoryName} · ${place.area}` : kind.label}</span>
        {place && place.lat !== null && place.lon !== null ? <MapLink name={name} lat={place.lat} lon={place.lon} /> : null}
      </span>
      {item.type === 'task' ? (
        <button className="taskchk" type="button" aria-pressed={item.done} aria-label={fill(T.view.taskToggle, { name })} onClick={() => fire(actions.toggleDone(trip.id, item.id))}>
          <Icon name="check" />
        </button>
      ) : null}
    </li>
  );
}

/** Nội dung theo từng trạng thái của "Hôm nay" (S17). */
function TodayBody({ trip, cat, view }: { readonly trip: Trip; readonly cat: TripCatalog; readonly view: TodayState }) {
  const all = <Button kind="ghost" block onClick={() => navigate(VIEW.TRIP, trip.id, 'ov')}>{T.today.allTrip}</Button>;
  if (view.kind === 'tentative') {
    return <EmptyState role="status" title={T.today.tentative.title} text={T.today.tentative.text} actions={<Button onClick={() => navigate(VIEW.TRIP, trip.id, 'ov')}>{T.today.tentative.action}</Button>} />;
  }
  if (view.kind === 'before') return <EmptyState role="status" title={T.today.before.title} text={fill(T.today.before.text, { n: view.daysLeft, trip: trip.name })} actions={all} />;
  if (view.kind === 'after') return <EmptyState role="status" title={T.today.after.title} text={fill(T.today.after.text, { trip: trip.name })} actions={all} />;
  if (view.kind === 'empty') return <EmptyState role="status" title={T.today.empty.title} text={fill(T.today.empty.text, { n: view.dayNumber })} actions={all} />;
  return (
    <div className="stack pad-x spaced-lg">
      <h2 className="h2">{fill(T.today.day, { n: view.dayNumber, date: dayLabel(view.day) })}</h2>
      <div className="chips" role="group" aria-label={T.today.title}>
        <span className="chip tint cat-canh">{fill(T.today.stats.places, { n: view.items.filter((i) => i.placeId).length })}</span>
        <span className="chip tint cat-am">{fill(T.today.stats.cost, { money: money(view.totalK) })}</span>
        {view.unknownCount ? <span className="chip tint cat-luu">{fill(T.today.stats.unknown, { n: view.unknownCount })}</span> : null}
      </div>
      <ul className="todaylist">
        {view.items.map((i) => (
          <TodayItem key={i.id} trip={trip} item={i} cat={cat} />
        ))}
      </ul>
      {all}
    </div>
  );
}

/** Khung "Hôm nay" của một chuyến: tiêu đề, (bản thử) ô giả lập ngày, nội dung theo trạng thái. */
function TodayFor({ trip }: { readonly trip: Trip }) {
  const now = useNow(MINUTE_MS);
  const [fake, setFake] = useState('');
  const today = fake || todayLocal(new Date(now));
  return (
    <DestinationGate destId={trip.destinationId}>
      {(dest) => (
        <>
          <div className="pagehead pad-x">
            <div>
              <IconButton icon="chevron-left" label={T.today.back} onClick={() => navigate(VIEW.TRIP, trip.id, 'ov')} />
            </div>
            <p className="note">{fill(T.today.eyebrow, { trip: trip.name })}</p>
            <h1>{T.today.title}</h1>
          </div>
          <TodayBody trip={trip} cat={catalogOf(dest)} view={todayView(trip, today)} />
          {IS_DEV ? (
            <div className="stack pad-x">
              <div className="protobox">
                <b>{T.today.demo.title}</b>
                <p className="note">{T.today.demo.note}</p>
                <Field label={T.today.demo.label} type="date" value={fake} onChange={setFake} />
                <Button kind="ghost" onClick={() => setFake('')}>{T.today.demo.reset}</Button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </DestinationGate>
  );
}

/** Màn "Hôm nay" (`#/today[/<mã chuyến>]`): chuyến theo địa chỉ, hoặc chuyến đang diễn ra/sắp tới gần nhất. Chưa có chuyến thì nói rõ. */
export function TodayScreen({ tripId }: { readonly tripId: string | null }) {
  const { state, trip: find } = useTrips();
  const now = useNow(MINUTE_MS);
  const trip = tripId ? find(tripId) : pickTodayTrip(state.trips, todayLocal(new Date(now)));
  if (!trip) {
    return <EmptyState pageTitle role="status" title={T.today.noTrip.title} text={T.today.noTrip.text} actions={<Button onClick={() => navigate(VIEW.TRIPS)}>{T.today.noTrip.action}</Button>} />;
  }
  return <TodayFor key={trip.id} trip={trip} />;
}
