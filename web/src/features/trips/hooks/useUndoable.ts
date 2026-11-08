import { useCallback } from 'react';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useReportError } from '../../identity/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { useTrips } from './TripsProvider.tsx';

/**
 * Chạy một thay đổi trên chuyến (qua máy chủ) rồi hiện thông báo có "Hoàn tác". Hoàn tác gửi các lệnh ngược lên máy chủ và chỉ chạy nếu chuyến
 * CHƯA đổi gì kể từ thay đổi này; nếu đã có thao tác khác xen giữa (đổi chỗ, tích việc, tab khác…) thì báo thay vì ghi đè mất chúng.
 */
export function useUndoable(): (tripId: string, change: () => Promise<unknown>, message: string) => Promise<boolean> {
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  return useCallback(
    async (tripId, change, message) => {
      // đợi các việc đang chạy của chuyến xong để "trước" không lẫn thay đổi chưa đọc lại (hai lần xóa liền nhau không hoàn tác quá tay)
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
