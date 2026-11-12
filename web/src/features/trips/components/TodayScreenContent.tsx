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
import { isPlaceItem } from '../model/itemCompletion.ts';
import { pickTodayTrip } from '../model/todayView.ts';
import type { TodayState } from '../model/todayView.ts';
import { catalogOf } from '../model/tripView.ts';
import type { TripCatalog } from '../model/tripView.ts';
import { TODAY_COPY as C } from '../today/today.copy.ts';
import { todayState, nextStop, visitedProgress } from '../today/todayState.ts';
import { Preparation } from '../today/Preparation.tsx';
import { TodayMap } from '../today/TodayMap.tsx';
import { NextCard, TodayItem } from '../today/TodayItems.tsx';
import '../today/today.css';
import { costSummaryText, summarizeCosts } from '../model/tripMath.ts';
import { StaleTripsNotice } from './StaleTripsNotice.tsx';

const MINUTE_MS = 60_000;

/** The content by each state of 'Today' (S17). */
function TodayBody({ trip, cat, view }: { readonly trip: Trip; readonly cat: TripCatalog; readonly view: TodayState }) {
  /** Opens the whole trip with the list as the way back, even when Today was opened by a direct URL. */
  const openTrip = (): void => {
    replaceRoute(VIEW.TRIPS);
    navigate(VIEW.TRIP, trip.id, 'ov');
  };
  const all = <Button kind="ghost" block onClick={openTrip}>{C.allTrip}</Button>;
  if (view.kind === 'tentative') {
    return <EmptyState role="status" title={C.tentative.title} text={C.tentative.text} actions={<Button onClick={openTrip}>{C.tentative.action}</Button>} />;
  }
  if (view.kind === 'before') return <div className="stack pad-x spaced-lg"><EmptyState role="status" title={C.before.title} text={fill(C.before.text, { n: view.daysLeft, trip: trip.name })} /><Preparation tripId={trip.id} />{all}</div>;
  if (view.kind === 'after') return <div className="stack pad-x spaced-lg"><EmptyState role="status" title={C.after.title} text={fill(C.after.text, { trip: trip.name })} /><VisitedSummary items={trip.items} /><Button icon="share-2" block onClick={() => navigate(VIEW.EXPORT, trip.id)}>{C.export}</Button>{all}</div>;
  if (view.kind === 'empty') return <EmptyState role="status" title={C.empty.title} text={fill(C.empty.text, { n: view.dayNumber })} actions={<><Button onClick={() => { replaceRoute(VIEW.TRIPS); navigate(VIEW.TRIP, trip.id, String(view.dayNumber)); }}>{C.add}</Button>{all}</>} />;
  return <TodayDay key={view.day} trip={trip} cat={cat} view={view} all={all} />;
}

/** The viewer's own summary from the visible items; with no place it says so plainly instead of guessing. */
function VisitedSummary({ items }: { readonly items: Trip['items'] }) {
  const progress = visitedProgress(items);
  return <p className="note" role="status">{C.personal}{': '}{progress.total ? fill(C.visited, { n: progress.visited, m: progress.total }) : C.noPlaces}</p>;
}

/** Separates the next point from the compact list; opens the done part after an action so the user sees the result. */
function TodayDay({ trip, cat, view, all }: { readonly trip: Trip; readonly cat: TripCatalog; readonly view: Extract<TodayState, { kind: 'day' }>; readonly all: React.ReactNode }) {
  const selected = nextStop(view.items);
  const [showDone, setShowDone] = useState(false);
  return (
    <div className="stack pad-x spaced-lg">
      <h2 className="h2">{fill(C.day, { n: view.dayNumber, date: dayLabel(view.day) })}</h2>
      <VisitedSummary items={view.items} />
      <div className="chips" role="group" aria-label={C.title}>
        <Chip tone="tint">{fill(C.stats.places, { n: view.items.filter(isPlaceItem).length })}</Chip>
        <Chip tone="tint">{costSummaryText(summarizeCosts({ items: view.items }))}</Chip>
        {view.unknownCount ? <Chip tone="tint">{fill(C.stats.unknown, { n: view.unknownCount })}</Chip> : null}
      </div>
      <TodayMap cat={cat} items={view.items} />
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

/** The 'Today' frame of a trip: the title, (trial version) a fake day box, the content by state. */
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

/** The 'Today' screen (`#/today[/<trip id>]`): the trip by address, or the nearest trip in progress/upcoming. With no trip it says so plainly. */
export function TodayScreen({ tripId }: { readonly tripId: string | null }) {
  const { state, trip: find } = useTrips();
  const now = useNow(MINUTE_MS);
  const trip = tripId ? find(tripId) : pickTodayTrip(state.trips, todayLocal(new Date(now)));
  if (!trip) {
    return <EmptyState pageTitle role="status" title={C.noTrip.title} text={C.noTrip.text} actions={<Button onClick={goBack}>{C.noTrip.action}</Button>} />;
  }
  return <><StaleTripsNotice /><TodayFor key={trip.id} trip={trip} /></>;
}
