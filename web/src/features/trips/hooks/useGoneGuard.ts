import { useEffect } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY } from '../../collab/index.ts';
import { isTripGone } from '../model/tripGone.ts';
import { useTrips } from './TripsProvider.tsx';

/**
 * Keeps the trip screen from staying 'alive' after the viewer loses access: each time the tab/app is returned to, the trip is re-read; if the server returns 404
 * (removed by the Organizer or the trip was deleted) it notifies once, reloads the list and pushes back to the trip list (DR-021: losing access is a state).
 */
export function useGoneGuard(tripId: string): void {
  const { actions, reload } = useTrips();
  const toast = useToast();
  useEffect(() => {
    const check = (): void => {
      if (document.visibilityState !== 'visible') return;
      actions.refreshTrip(tripId).catch((e: unknown) => {
        if (!isTripGone(e)) return;
        toast.show(COLLAB_COPY.people.gone);
        reload();
        navigate(VIEW.TRIPS);
      });
    };
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [actions, reload, toast, tripId]);
}
