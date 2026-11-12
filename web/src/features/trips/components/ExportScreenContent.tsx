import { lazy, Suspense } from 'react';
import { goBack } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { DestinationGate } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { EXPORT_COPY as C } from '../export/export.copy.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

const PngPreview = lazy(() => import('../export/PngPreview.tsx'));

/** The PNG export screen, with the drawing part lazy loaded. There is no PDF/Calendar yet so no fake button is shown (B-07). */
export function ExportScreen({ tripId }: { readonly tripId: string }) {
  const { trip: find } = useTrips();
  const trip = find(tripId);
  if (!trip) return <EmptyState role="status" title={T.view.notFoundTitle} text={T.view.notFoundText} actions={<Button onClick={goBack}>{T.view.backToList}</Button>} />;
  return (
    <DestinationGate destId={trip.destinationId}>
      {(dest) => (
        <>
          <div className="pagehead pad-x">
            <div><IconButton icon="chevron-left" label={T.export.back} onClick={goBack} /></div>
            <p className="note">{trip.name}</p><h1>{T.export.title}</h1>
          </div>
          <Suspense fallback={<p role="status" className="pad-x">{C.loading}</p>}>
            <PngPreview trip={trip} destination={dest} />
          </Suspense>
        </>
      )}
    </DestinationGate>
  );
}
