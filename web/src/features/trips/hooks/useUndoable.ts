import { useCallback } from 'react';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { useTrips } from './TripsProvider.tsx';

/**
 * Chạy một thay đổi trên chuyến rồi hiện thông báo có "Hoàn tác". Hoàn tác chỉ khôi phục nếu chuyến CHƯA đổi gì kể từ thay đổi này;
 * nếu đã có thao tác khác xen giữa (đổi chỗ, tích việc, tab khác…) thì báo thay vì ghi đè mất chúng.
 */
export function useUndoable(): (tripId: string, change: () => void, message: string) => void {
  const { actions } = useTrips();
  const toast = useToast();
  return useCallback(
    (tripId, change, message) => {
      const before = actions.current(tripId);
      change();
      const after = actions.current(tripId);
      toast.show(message, () => {
        if (before && actions.current(tripId) === after) actions.restore(before);
        else toast.show(T.undo.changed);
      });
    },
    [actions, toast],
  );
}
