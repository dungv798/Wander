import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/**
 * Hộp xác nhận xóa cả chuyến (xóa MỀM, PO 28/10/2026): chuyến vào "Chuyến đã xóa gần đây" và khôi phục được; thông báo sau khi xóa có
 * "Hoàn tác". Xóa xong quay về danh sách chuyến. Xóa vĩnh viễn chuyến cần xác thực lại (D25) nên chưa có.
 */
export function DeleteTripSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip } = useTripView();
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  /** Xóa mềm chuyến, về danh sách và hiện "Hoàn tác" (khôi phục rồi mở lại chuyến). */
  const remove = (): void => {
    setBusy(true);
    actions.deleteTrip(trip.id).then(() => {
      onClose();
      navigate(VIEW.TRIPS);
      toast.show(fill(T.deleteTrip.done, { name: trip.name }), () => {
        actions.restoreTrip(trip.id).then(() => navigate(VIEW.TRIP, trip.id, 'ov')).catch(report);
      });
    }).catch((e: unknown) => {
      report(e);
      setBusy(false);
    });
  };
  return (
    <Sheet label={T.deleteTrip.title} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{fill(T.deleteTrip.heading, { name: trip.name })}</h2>
          <p className="note spaced">{T.deleteTrip.text}</p>
        </div>
        <div className="stack">
          <Button kind="danger" block disabled={busy} onClick={remove}>{T.deleteTrip.confirm}</Button>
          <Button kind="ghost" block onClick={onClose}>{T.deleteTrip.cancel}</Button>
        </div>
      </div>
    </Sheet>
  );
}
