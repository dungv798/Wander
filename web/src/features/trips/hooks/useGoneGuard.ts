import { useEffect } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY } from '../../collab/index.ts';
import { isTripGone } from '../model/tripGone.ts';
import { useTrips } from './TripsProvider.tsx';

/**
 * Giữ cho màn chuyến đi không "sống" sau khi người xem mất quyền: mỗi khi quay lại tab/ứng dụng, đọc lại chuyến; máy chủ trả 404
 * (bị Organizer gỡ hoặc chuyến đã xóa) thì báo một lần, nạp lại danh sách và đẩy về danh sách chuyến (DR-021: mất quyền là một trạng thái).
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
