import { useCallback } from 'react';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useReportError } from '../../identity/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { useTrips } from './TripsProvider.tsx';

/**
 * Runs a change on the trip (through the server) and then shows a notice with 'Undo'. Undo sends inverse commands to the server and only runs if the trip has
 * NOT changed since this change; if another action came in between (reorder, tick a task, another tab...) it reports that instead of overwriting them.
 */
export function useUndoable(): (tripId: string, change: () => Promise<unknown>, message: string) => Promise<boolean> {
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  return useCallback(
    async (tripId, change, message) => {
      // waits for the trip's running jobs to finish so the 'before' does not mix in changes not yet re-read (two deletes in a row are not undone too far)
      try {
        await actions.idle(tripId);
        const before = actions.current(tripId);
        await change();
        const after = actions.current(tripId);
        toast.show(message, () => {
          if (before && actions.current(tripId) === after) actions.revert(before).catch(report);
          else toast.show(T.undo.changed);
        });
        return true;
      } catch (error) { report(error); return false; }
    },
    [actions, toast, report],
  );
}
