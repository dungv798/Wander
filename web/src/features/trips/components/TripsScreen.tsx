import { useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useDestination } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { DeletedTripsSheet } from './DeletedTripsSheet.tsx';
import { CreateTripSheet } from './CreateTripSheet.tsx';
import { TripCard } from './TripCard.tsx';
import { TripWizard } from './TripWizard.tsx';
import type { Trip } from '../model/trip.types.ts';

/** Ảnh bìa của chuyến: ảnh nơi đầu tiên có trong kho, hoặc ảnh bìa điểm đến. */
function DestinationTripCard({ trip }: { readonly trip: Trip }) {
  const { state } = useDestination(trip.destinationId);
  const dest = state.status === 'ready' ? state.data : null;
  const cover = trip.items.flatMap(item => dest?.places.find(place => place.id === item.placeId)?.photos[0]?.url ?? []).find(Boolean) ?? dest?.coverUrl ?? '';
  return <TripCard trip={trip} cover={cover} />;
}

/** Màn "Chuyến đi": danh sách chuyến của bạn, nút tạo mới (nhanh hoặc theo bước), hoặc trạng thái rỗng dẫn tới Khám phá. */
export function TripsScreen({ destId }: { readonly destId: string }) {
  const { state, status, reload } = useTrips();
  const [sheet, setSheet] = useState<'create' | 'wizard' | 'deleted' | null>(null);
  return (
    <>
      <div className="pagehead pad-x">
        <div className="headrow">
          <IconButton icon="chevron-left" label={COPY.nav.explore} onClick={() => navigate(VIEW.EXPLORE)} />
          <div>
            <p className="note">{T.list.owner}</p>
            <h1>{T.list.title}</h1>
          </div>
          <IconButton icon="shield" label={T.list.security} onClick={() => navigate(VIEW.SECURITY)} />
        </div>
      </div>
      {status === 'loading' && !state.trips.length ? (
        <div className="waitbox pad-x" role="status">
          <span className="spin" aria-hidden="true" />
          {T.list.loading}
        </div>
      ) : status === 'error' ? (
        <EmptyState title={T.list.errorTitle} text={T.list.errorText} actions={<Button onClick={reload}>{T.list.retry}</Button>} />
      ) : state.trips.length ? (
        <div className="stack pad-x spaced-lg">
          {state.trips.map((t) => (
            <DestinationTripCard key={t.id} trip={t} />
          ))}
          <Button kind="ghost" block icon="plus" onClick={() => setSheet('create')}>{T.list.createNew}</Button>
          <Button kind="ghost" block icon="route" onClick={() => setSheet('wizard')}>{T.list.stepwise}</Button>
        </div>
      ) : (
        <EmptyState
          title={T.list.emptyTitle}
          text={T.list.emptyText}
          actions={
            <>
              <Button onClick={() => navigate(VIEW.EXPLORE)}>{T.list.explore}</Button>
              <Button kind="ghost" icon="plus" onClick={() => setSheet('create')}>{T.list.createNew}</Button>
              <Button kind="ghost" icon="route" onClick={() => setSheet('wizard')}>{T.list.stepwise}</Button>
            </>
          }
        />
      )}
      <div className="stack pad-x spaced-lg">
        {state.trips.length ? <Button kind="ghost" block icon="sun" onClick={() => navigate(VIEW.TODAY)}>{T.today.open}</Button> : null}
        <Button kind="ghost" block icon="trash" onClick={() => setSheet('deleted')}>{T.deletedTrips.open}</Button>
        <Button kind="ghost" block onClick={() => navigate(VIEW.SETTINGS)}>{T.list.settings}</Button>
      </div>
      {sheet === 'create' ? <CreateTripSheet destId={destId} picked={[]} onClose={() => setSheet(null)} /> : null}
      {sheet === 'wizard' ? <TripWizard destId={destId} onClose={() => setSheet(null)} /> : null}
      {sheet === 'deleted' ? <DeletedTripsSheet onClose={() => setSheet(null)} /> : null}
    </>
  );
}
