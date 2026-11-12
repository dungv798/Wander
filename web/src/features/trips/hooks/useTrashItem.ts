import { useCallback } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { trashFull } from '../model/tripTrash.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { useTrips } from './TripsProvider.tsx';
import { useUndoable } from './useUndoable.ts';

/** Soft-deletes an item with Undo (D19). When the trash is full it does NOT delete and says so plainly (it never permanently deletes an old item on its own). Returns true if it was deleted. */
export function useTrashItem(): (tripId: string, itemId: string, name: string) => boolean {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const toast = useToast();
  return useCallback(
    (tripId, itemId, name) => {
      const current = actions.current(tripId);
      if (current && trashFull(current)) {
        toast.show(fill(T.trash.full, { max: LIMITS.MAX_TRASH }));
        return false;
      }
      undoable(tripId, () => actions.trashItem(tripId, itemId), fill(T.trash.deleted, { name }));
      return true;
    },
    [actions, undoable, toast],
  );
}
