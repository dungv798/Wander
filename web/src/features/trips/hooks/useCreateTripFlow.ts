import { useCallback, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useReportError } from '../../identity/index.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import type { PlaceRef } from '../model/tripState.ts';
import type { NewTrip } from '../model/tripState.ts';
import { useTrips } from './TripsProvider.tsx';
import { TRIP_TAB } from '../model/tripTabs.ts';

/** Tạo một chuyến trống qua máy chủ: khi xong đóng tờ, mở chuyến và báo; thất bại báo lỗi. Trả true nếu tạo được. `busy` để khóa nút trong lúc chờ. */
export function useCreateTripFlow(onClose: () => void): { readonly busy: boolean; readonly create: (n: NewTrip, picked?: readonly PlaceRef[]) => Promise<boolean> } {
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const create = useCallback(
    (n: NewTrip, picked: readonly PlaceRef[] = []) => {
      setBusy(true);
      return actions.create(n, picked).then((trip) => {
        onClose();
        navigate(VIEW.TRIP, trip.id, picked.length ? TRIP_TAB.UNASSIGNED : TRIP_TAB.OVERVIEW);
        toast.show(fill(T.create.saved, { name: trip.name }));
        return true;
      }).catch((e: unknown) => {
        report(e);
        return false;
      }).finally(() => setBusy(false));
    },
    [actions, onClose, toast, report],
  );
  return { busy, create };
}
