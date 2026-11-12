import { useCallback, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useDiscover } from '../../discover/index.ts';
import { useReportError } from '../../identity/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import type { PlaceRef } from '../model/tripState.ts';
import type { NewTrip } from '../model/tripState.ts';
import { useTrips } from './TripsProvider.tsx';
import { TRIP_TAB } from '../model/tripTabs.ts';

/** Creates an empty trip through the server: when done it closes the sheet, opens the trip and notifies; a failure reports an error. Returns true if it was created. `busy` locks the button while waiting. */
export function useCreateTripFlow(onClose: () => void): { readonly busy: boolean; readonly create: (n: NewTrip, picked?: readonly PlaceRef[]) => Promise<boolean> } {
  const { actions } = useTrips();
  const { actions: discover } = useDiscover();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const create = useCallback(
    (n: NewTrip, picked: readonly PlaceRef[] = []) => {
      setBusy(true);
      return actions.create(n, picked).then((trip) => {
        discover.markSaved(picked.map((place) => place.id));
        onClose();
        navigate(VIEW.TRIP, trip.id, picked.length ? TRIP_TAB.UNASSIGNED : TRIP_TAB.OVERVIEW);
        toast.show(fill(T.create.saved, { name: trip.name }));
        return true;
      }).catch((e: unknown) => {
        report(e);
        return false;
      }).finally(() => setBusy(false));
    },
    [actions, discover, onClose, toast, report],
  );
  return { busy, create };
}
