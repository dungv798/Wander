import { lazy, Suspense, useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { DestinationGate, pickedOf, useDiscover, useCurrentDestination, useDestination } from '../../discover/index.ts';
import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { todayLocal } from '../../../shared/lib/dates.ts';
import { TripListControls } from '../list/TripListControls.tsx';
import { countTripStatuses, selectTrips } from '../list/tripList.ts';
import { DEFAULT_TRIP_LIST, useTripList } from '../list/useTripList.ts';
import { TRIP_FILTER_MIN } from '../list/list.const.ts';
import { LIST_COPY as L } from '../list/list.copy.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { ScreenSkeleton } from '../../../shared/ui/Skeleton.tsx';
import { LazyCreateTripSheet as CreateTripSheet, LazyTripWizard as TripWizard, preloadCreateTrip, preloadTripWizard } from './LazyTripSheets.tsx';
import { TripCard } from './TripCard.tsx';
import type { Trip } from '../model/trip.types.ts';
import { TRIP_COVERS } from '../model/tripCovers.const.ts';
import { coverUrl } from '../model/cover.ts';

const DeletedTripsSheet = lazy(() => import('./DeletedTripsSheet.tsx').then(module => ({ default: module.DeletedTripsSheet })));

/** Nhắc các nơi chọn dở theo điểm đến và mở đúng hộp thoại lưu dùng ở màn Đã chọn. */
function PendingSelection({ dest, onSave }: { readonly dest: DestinationDetail; readonly onSave: (picked: readonly PlaceView[]) => void }) {
  const { state } = useDiscover();
  const picked = pickedOf(state, dest.places);
  if (!picked.length) return null;
  return <section className="pending-selection seccard" aria-label={fill(T.list.pending, { n: picked.length, dest: dest.name })}>
    <h2>{fill(T.list.pending, { n: picked.length, dest: dest.name })}</h2>
    <Button block onClick={() => onSave(picked)}>{fill(T.list.savePending, { n: picked.length })}</Button>
  </section>;
}

/** Ảnh bìa của điểm đến trong catalog; không tạo dữ liệu ảnh riêng cho chuyến. */
function DestinationTripCard({ trip }: { readonly trip: Trip }) {
  const { state } = useDestination(trip.destinationId);
  const dest = state.status === 'ready' ? state.data : null;
  const selected = TRIP_COVERS[trip.destinationId];
  const cover = dest?.places.flatMap(place => place.photos).find(photo => selected && photo.url.endsWith(`/${selected}`))?.url ?? dest?.coverUrl ?? '';
  return <TripCard trip={trip} cover={coverUrl(trip.cover, dest, cover)} />;
}

/** Đầu danh sách chuyến với lối quay lại khám phá và mở bảo mật. */
function TripsHeading() {
  return <div className="pagehead pad-x"><div className="headrow">
    <IconButton icon="chevron-left" label={COPY.nav.explore} onClick={() => navigate(VIEW.EXPLORE)} />
    <div><p className="note">{T.list.owner}</p><h1>{T.list.title}</h1></div>
    <IconButton icon="shield" label={T.list.security} onClick={() => navigate(VIEW.SECURITY)} />
  </div></div>;
}

/** Màn "Chuyến đi": danh sách chuyến của bạn, nút tạo mới (nhanh hoặc theo bước), hoặc trạng thái rỗng dẫn tới Khám phá. */
export function TripsScreen({ destId }: { readonly destId: string }) {
  const { state, status, reload } = useTrips();
  const [sheet, setSheet] = useState<'create' | 'wizard' | 'deleted' | null>(null);
  const [saving, setSaving] = useState<{ readonly destId: string; readonly picked: readonly PlaceView[] } | null>(null);
  const { destinations, select } = useCurrentDestination();
  const { state: discover } = useDiscover();
  const hasPending = Object.values(discover.decisions).includes('like');
  const { options, searchOptions, setOptions } = useTripList();
  const showFilters = state.trips.length >= TRIP_FILTER_MIN;
  const today = todayLocal();
  const visible = showFilters ? selectTrips(state.trips, searchOptions, today, Object.fromEntries(destinations.map(d => [d.id, d.name]))) : state.trips;
  return (
    <>
      <TripsHeading />
      {hasPending ? <div className="stack pad-x spaced-lg">{destinations.map(dest => <DestinationGate key={dest.id} destId={dest.id}>{detail => <PendingSelection dest={detail} onSave={picked => { select(dest.id); setSaving({ destId: dest.id, picked }); }} />}</DestinationGate>)}</div> : null}
      {showFilters ? <TripListControls options={options} counts={countTripStatuses(state.trips, today)} onChange={setOptions} /> : null}
      {status === 'loading' && !state.trips.length ? (
        <div className="waitbox pad-x" role="status">
          <span className="spin" aria-hidden="true" />
          {T.list.loading}
        </div>
      ) : status === 'error' ? (
        <EmptyState title={T.list.errorTitle} text={T.list.errorText} actions={<Button onClick={reload}>{T.list.retry}</Button>} />
      ) : state.trips.length ? (
        <div className="stack pad-x spaced-lg">
          <div className="trips-cta">
            <Button arrow icon="plus" onPointerEnter={preloadCreateTrip} onFocus={preloadCreateTrip} onPointerDown={preloadCreateTrip} onClick={() => setSheet('create')}>{T.list.createNew}</Button>
            <Button kind="ghost" icon="route" onPointerEnter={preloadTripWizard} onFocus={preloadTripWizard} onPointerDown={preloadTripWizard} onClick={() => setSheet('wizard')}>{T.list.stepwise}</Button>
          </div>
          {!visible.length ? <EmptyState title={L.emptyTitle} text={L.emptyText} actions={<Button onClick={() => setOptions(DEFAULT_TRIP_LIST)}>{L.clear}</Button>} /> : null}
          {visible.map((t) => <DestinationTripCard key={t.id} trip={t} />)}
        </div>
      ) : (
        <EmptyState
          title={T.list.emptyTitle}
          text={T.list.emptyText}
          actions={
            <>
              <Button kind={hasPending ? 'ghost' : 'primary'} onClick={() => navigate(VIEW.EXPLORE)}>{T.list.explore}</Button>
              <Button kind="ghost" icon="plus" onPointerEnter={preloadCreateTrip} onFocus={preloadCreateTrip} onPointerDown={preloadCreateTrip} onClick={() => setSheet('create')}>{T.list.createNew}</Button>
              <Button kind="ghost" icon="route" onPointerEnter={preloadTripWizard} onFocus={preloadTripWizard} onPointerDown={preloadTripWizard} onClick={() => setSheet('wizard')}>{T.list.stepwise}</Button>
            </>
          }
        />
      )}
      <div className="trips-links pad-x">
        {state.trips.length ? <Button kind="ghost" icon="sun" onClick={() => navigate(VIEW.TODAY)}>{T.today.open}</Button> : null}
        <Button kind="ghost" icon="trash" onClick={() => setSheet('deleted')}>{T.deletedTrips.open}</Button>
        <Button kind="ghost" onClick={() => navigate(VIEW.SETTINGS)}>{T.list.settings}</Button>
      </div>
      {sheet === 'create' ? <CreateTripSheet destId={destId} picked={[]} onClose={() => setSheet(null)} /> : null}
      {saving ? <CreateTripSheet destId={saving.destId} picked={saving.picked} onClose={() => setSaving(null)} /> : null}
      {sheet === 'wizard' ? <TripWizard destId={destId} onClose={() => setSheet(null)} /> : null}
      {sheet === 'deleted' ? <Suspense fallback={<Sheet label={T.deletedTrips.title} onClose={() => setSheet(null)}><ScreenSkeleton /></Sheet>}><DeletedTripsSheet onClose={() => setSheet(null)} /></Suspense> : null}
    </>
  );
}
