import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEDIA } from '../../../shared/const/app.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery.ts';
import { navigate, replaceRoute } from '../../../shared/router/hashRoute.ts';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useBottomSheet } from '../../../shared/ui/bottom-sheet/useBottomSheet.ts';
import type { Snap } from '../../../shared/ui/bottom-sheet/bottomSheet.const.ts';
import { DestinationGate, usePlaceSheet } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { TripViewProvider } from '../hooks/TripViewContext.tsx';
import type { Overlay } from '../hooks/TripViewContext.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import type { Trip } from '../model/trip.types.ts';
import { tripDays, unassignedItems } from '../model/tripMath.ts';
import { catalogOf, itemName } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { DayTab } from './DayTab.tsx';
import { useTripToast } from '../hooks/useTripToast.ts';
import { useGoneGuard } from '../hooks/useGoneGuard.ts';
import { ItemCtaSlot, ItemInfoSlot } from './ItemInfoSlot.tsx';
import { OverviewTab } from './OverviewTab.tsx';
import { CostBox } from './CostBox.tsx';
import { TripCoverHead } from './TripCoverHead.tsx';
import { TRIP_PANEL_ID, TripNav, activeTabId } from './TripNav.tsx';
import { UnassignedTab } from './UnassignedTab.tsx';
import { TripMap } from './TripMap.tsx';
import { TripOverlays } from './TripOverlays.tsx';
import { modeOfTab, validTab } from '../model/tripTabs.ts';
import { StaleTripsNotice } from './StaleTripsNotice.tsx';
import { useScrollCollapse } from '../hooks/useScrollCollapse.ts';

const ANNOUNCE_DELAY_MS = 30;
/** The default open step of the sheet: going straight to Schedule (the main job is ordering the places) opens the highest step to see many cards; the other tabs open at the middle step (B-01). */
const DEFAULT_SNAP: Snap = 'half';
const SCHEDULE_SNAP: Snap = 'full';

/** An announcement for screen readers: returns [the current content, the read function]; clears and sets again so the same sentence is read once more. */
function useAnnouncer(): readonly [string, (text: string) => void] {
  const [text, setText] = useState('');
  const announce = useCallback(
    /** Sets the new content after a short beat. */
    (next: string) => {
      setText('');
      window.setTimeout(() => setText(next), ANNOUNCE_DELAY_MS);
    },
    [],
  );
  return [text, announce];
}

/** The head of the sheet: the drag handle, the trip cover (with the Share/Travel companions group) and the two control levels for the view mode + day choice. */
function TripHead({ trip, dest, days, tab, lastDay, onTab, onPeople }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly days: readonly string[]; readonly tab: string; readonly lastDay: string; readonly onTab: (t: string) => void; readonly onPeople: () => void }) {
  return (
    <>
      <button className="grab" type="button" aria-label={T.view.sheetHandle} aria-expanded="true" />
      <TripCoverHead trip={trip} dest={dest} onPeople={onPeople} compact={modeOfTab(tab) !== 'overview'} />
      <TripNav tab={tab} days={days} unassigned={unassignedItems(trip).length} lastDay={lastDay} onTab={onTab} />
    </>
  );
}

/** The map frame at the top of the trip screen with a back button and an edit-trip button. */
function MapBox({ covered, tripId, onEdit }: { readonly covered: number; readonly tripId: string; readonly onEdit: (() => void) | null }) {
  return (
    <section className="mapbox">
      <TripMap coveredBottom={covered} />
      <div className="top">
        <IconButton icon="chevron-left" label={T.view.backToList} onClick={() => navigate(VIEW.TRIPS)} />
        <div className="r">
          <IconButton icon="sun" label={T.today.open} onClick={() => navigate(VIEW.TODAY, tripId)} />
          <IconButton icon="share-2" label={T.export.open} onClick={() => navigate(VIEW.EXPORT, tripId)} />
          {onEdit ? <IconButton icon="pencil" label={T.view.edit} onClick={onEdit} /> : null}
        </div>
      </div>
    </section>
  );
}

/** The content of the trip screen once there is a trip and a destination: the map, the draggable sheet (head + body), floating buttons, the overlay sheets. */
function TripContent({ trip, dest, sub }: { readonly trip: Trip; readonly dest: DestinationDetail; readonly sub: string | null }) {
  useTripToast();
  const days = useMemo(() => tripDays(trip), [trip]);
  const tab = validTab(sub, days.length);
  const mode = modeOfTab(tab);
  // The day most recently viewed: going back into Schedule mode returns to exactly that day.
  const [lastDay, setLastDay] = useState('1');
  if (mode === 'schedule' && tab !== lastDay) setLastDay(tab);
  const cat = useMemo(() => catalogOf(dest), [dest]);
  const place = usePlaceSheet();
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [sorting, setSorting] = useState(false);
  const [announcement, announce] = useAnnouncer();
  const [covered, setCovered] = useState(0);
  const sheetRef = useRef<HTMLElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const drawer = useMediaQuery(MEDIA.DRAWER);
  const collapsed = useScrollCollapse(scrollRef, mode === 'schedule' && !drawer);
  useBottomSheet(sheetRef, headRef, !drawer, mode === 'schedule' ? SCHEDULE_SNAP : DEFAULT_SNAP, (_snap, visible) => setCovered(visible));

  // Changing tabs (Overview <-> Day n) always starts from the top of the list, keeping no scroll position of the previous tab.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  const setTab = useCallback((t: string) => replaceRoute(VIEW.TRIP, trip.id, t), [trip.id]);
  const openItem = useCallback(
    /** A place -> the detail sheet with a summary and the trip's buttons; a free-form item -> the editor. */
    (itemId: string) => {
      const item = trip.items.find((i) => i.id === itemId);
      if (!item) return;
      if (item.placeId && cat.place(item.placeId)) place.open(item.placeId, { extra: <ItemInfoSlot tripId={trip.id} itemId={itemId} onEdit={() => setOverlay({ kind: 'editor', itemId, preset: null })} />, cta: <ItemCtaSlot tripId={trip.id} itemId={itemId} name={itemName(item, cat)} onPickDay={() => setOverlay({ kind: 'pickDay', itemId })} onRequestDelete={() => setOverlay({ kind: 'requestDelete', itemId })} /> });
      else setOverlay({ kind: 'editor', itemId, preset: null });
    },
    [trip, cat, place],
  );
  const value = useMemo(
    () => ({ trip, cat, days, tab, setTab, setOverlay, sorting, setSorting, openItem, addMore: () => navigate(VIEW.DECK, dest.id, trip.id), announce }),
    [trip, cat, days, tab, setTab, sorting, openItem, announce, dest.id],
  );

  return (
    <TripViewProvider value={value}>
      <MapBox covered={drawer ? 0 : covered} tripId={trip.id} onEdit={permissionsOf(trip).manageTrip ? () => setOverlay({ kind: 'editTrip' }) : null} />
      <section className="sheetbody" ref={sheetRef}>
        <div className="sheet-head pad-x" ref={headRef} data-collapsed={collapsed || undefined}>
          <TripHead trip={trip} dest={dest} days={days} tab={tab} lastDay={lastDay} onTab={setTab} onPeople={() => setOverlay({ kind: 'people' })} />
        </div>
        <div className="sheet-scroll" ref={scrollRef}>
          <div className="pad-x">
            <div className="tbody" role="tabpanel" id={TRIP_PANEL_ID} aria-labelledby={activeTabId(tab)}>
              {mode === 'overview' ? <OverviewTab /> : mode === 'schedule' ? <DayTab index={Number(tab) - 1} /> : mode === 'unassigned' ? <UnassignedTab /> : <CostBox allDays />}
            </div>
            <div className="trip-add"><Button kind="ghost" icon="plus" onClick={value.addMore}>{T.view.addPlaces}</Button></div>
          </div>
        </div>
      </section>
      <div className="sr" aria-live="polite">
        {announcement}
      </div>
      <TripOverlays overlay={overlay} onClose={() => setOverlay(null)} />
    </TripViewProvider>
  );
}

/** The trip screen by the id in the address; with no trip it says so plainly and gives the way back to the list. */
export function TripScreen({ tripId, sub }: { readonly tripId: string; readonly sub: string | null }) {
  const { trip: find } = useTrips();
  useGoneGuard(tripId);
  const trip = find(tripId);
  if (!trip) {
    return <EmptyState role="status" title={T.view.notFoundTitle} text={T.view.notFoundText} actions={<Button onClick={() => navigate(VIEW.TRIPS)}>{T.view.backToList}</Button>} />;
  }
  return <><StaleTripsNotice /><DestinationGate destId={trip.destinationId}>{(dest) => <TripContent key={trip.id} trip={trip} dest={dest} sub={sub} />}</DestinationGate></>;
}
