import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { dayLabel, todayLocal } from '../../../shared/lib/dates.ts';
import { goBack, navigate, replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { Chip } from '../../../shared/ui/Chip.tsx';
import { DestinationGate } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import type { Trip } from '../model/trip.types.ts';
import { pickTodayTrip } from '../model/todayView.ts';
import type { TodayState } from '../model/todayView.ts';
import { catalogOf } from '../model/tripView.ts';
import type { TripCatalog } from '../model/tripView.ts';
import { TODAY_COPY as C } from '../today/today.copy.ts';
import { todayState, nextStop, visitedCount } from '../today/todayState.ts';
import { Preparation } from '../today/Preparation.tsx';
import { NextCard, TodayItem } from '../today/TodayItems.tsx';
import '../today/today.css';
import { costSummaryText, summarizeCosts } from '../model/tripMath.ts';

const MINUTE_MS = 60_000;

/** Nội dung theo từng trạng thái của "Hôm nay" (S17). */
function TodayBody({ trip, cat, view }: { readonly trip: Trip; readonly cat: TripCatalog; readonly view: TodayState }) {
  /** Mở cả chuyến với danh sách là lối về, kể cả khi Hôm nay được mở bằng URL trực tiếp. */
  const openTrip = (): void => {
    replaceRoute(VIEW.TRIPS);
    navigate(VIEW.TRIP, trip.id, 'ov');
  };
  const all = <Button kind="ghost" block onClick={openTrip}>{C.allTrip}</Button>;
  if (view.kind === 'tentative') {
    return <EmptyState role="status" title={C.tentative.title} text={C.tentative.text} actions={<Button onClick={openTrip}>{C.tentative.action}</Button>} />;
  }
  if (view.kind === 'before') return <div className="stack pad-x spaced-lg"><EmptyState role="status" title={C.before.title} text={fill(C.before.text, { n: view.daysLeft, trip: trip.name })} /><Preparation tripId={trip.id} />{all}</div>;
  if (view.kind === 'after') return <div className="stack pad-x spaced-lg"><EmptyState role="status" title={C.after.title} text={fill(C.after.text, { trip: trip.name })} /><p className="note">{visitedCount(trip.items) ? fill(C.visited, { n: visitedCount(trip.items) }) : C.visitedUnknown}</p><Button icon="share-2" block onClick={() => navigate(VIEW.EXPORT, trip.id)}>{C.export}</Button>{all}</div>;
  if (view.kind === 'empty') return <EmptyState role="status" title={C.empty.title} text={fill(C.empty.text, { n: view.dayNumber })} actions={<><Button onClick={() => { replaceRoute(VIEW.TRIPS); navigate(VIEW.TRIP, trip.id, String(view.dayNumber)); }}>{C.add}</Button>{all}</>} />;
  return <TodayDay key={view.day} trip={trip} cat={cat} view={view} all={all} />;
}

/** Tách điểm kế tiếp khỏi danh sách gọn; mở phần đã xong sau thao tác để người dùng thấy kết quả. */
function TodayDay({ trip, cat, view, all }: { readonly trip: Trip; readonly cat: TripCatalog; readonly view: Extract<TodayState, { kind: 'day' }>; readonly all: React.ReactNode }) {
  const selected = nextStop(view.items);
  const [showDone, setShowDone] = useState(false);
  return (
    <div className="stack pad-x spaced-lg">
      <h2 className="h2">{fill(C.day, { n: view.dayNumber, date: dayLabel(view.day) })}</h2>
      <div className="chips" role="group" aria-label={C.title}>
        <Chip tone="tint">{fill(C.stats.places, { n: view.items.filter((i) => i.placeId).length })}</Chip>
        <Chip tone="tint">{costSummaryText(summarizeCosts({ items: view.items }))}</Chip>
        {view.unknownCount ? <Chip tone="tint">{fill(C.stats.unknown, { n: view.unknownCount })}</Chip> : null}
      </div>
      {selected.next ? <NextCard trip={trip} cat={cat} item={selected.next} previous={selected.previous} onCompleted={() => setShowDone(true)} /> : <EmptyState role="status" title={C.allDone} text={C.allDoneText} />}
      {selected.remaining.length ? <section><h3>{fill(C.remaining, { n: selected.remaining.length })}</h3><ul className="todaylist">
        {selected.remaining.map((i) => (
          <TodayItem key={i.id} trip={trip} item={i} cat={cat} onCompleted={() => setShowDone(true)} />
        ))}
      </ul></section> : null}
      {selected.completed.length ? <details className="today-completed" open={showDone} onToggle={(event) => setShowDone(event.currentTarget.open)}><summary>{fill(C.completed, { n: selected.completed.length })}</summary><ul className="todaylist">{selected.completed.map((i) => <TodayItem key={i.id} trip={trip} item={i} cat={cat} />)}</ul></details> : null}
      <Preparation tripId={trip.id} />
      {all}
    </div>
  );
}

/** Khung "Hôm nay" của một chuyến: tiêu đề, (bản thử) ô giả lập ngày, nội dung theo trạng thái. */
function TodayFor({ trip }: { readonly trip: Trip }) {
  const now = useNow(MINUTE_MS);
  const [fake, setFake] = useState('');
  return (
    <DestinationGate destId={trip.destinationId}>
      {(dest) => (
        <>
          <div className="pagehead pad-x">
            <div>
              <IconButton icon="chevron-left" label={C.back} onClick={goBack} />
            </div>
            <p className="note">{fill(C.eyebrow, { trip: trip.name })}</p>
            <h1>{C.title}</h1>
          </div>
          <TodayBody trip={trip} cat={catalogOf(dest)} view={todayState(trip, new Date(now), fake)} />
          {IS_DEV ? (
            <div className="stack pad-x">
              <div className="protobox">
                <b>{C.demo.title}</b>
                <p className="note">{C.demo.note}</p>
                <Field label={C.demo.label} type="date" value={fake} onChange={setFake} />
                <Button kind="ghost" onClick={() => setFake('')}>{C.demo.reset}</Button>
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
    return <EmptyState pageTitle role="status" title={C.noTrip.title} text={C.noTrip.text} actions={<Button onClick={goBack}>{C.noTrip.action}</Button>} />;
  }
  return <TodayFor key={trip.id} trip={trip} />;
}
