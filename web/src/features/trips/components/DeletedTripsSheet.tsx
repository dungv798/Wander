import { useEffect, useState } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useReportError } from '../../identity/index.ts';
import { HttpTripsGateway } from '../api/HttpTripsGateway.ts';
import type { DeletedTrip } from '../api/TripsGateway.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Cổng dùng để liệt kê chuyến đã xóa (không đi qua kho vì chúng không còn là chuyến "đang có"). */
const GATEWAY = new HttpTripsGateway(apiClient);

/** Tờ "Chuyến đã xóa gần đây": liệt kê chuyến xóa mềm (xóa gần nhất trước) với nút Khôi phục; khôi phục xong mở chuyến đó. */
export function DeletedTripsSheet({ onClose }: { readonly onClose: () => void }) {
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  const [list, setList] = useState<readonly DeletedTrip[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let live = true;
    GATEWAY.loadDeleted().then((found) => {
      if (live) setList(found);
    }).catch((e: unknown) => {
      if (live) report(e);
    });
    return () => {
      live = false;
    };
  }, [report]);

  /** Khôi phục một chuyến rồi mở nó. */
  const restore = (t: DeletedTrip): void => {
    setBusy(true);
    actions.restoreTrip(t.id).then(() => {
      toast.show(fill(T.deletedTrips.restored, { name: t.name }));
      onClose();
      navigate(VIEW.TRIP, t.id, 'ov');
    }).catch(report).finally(() => setBusy(false));
  };

  return (
    <Sheet label={T.deletedTrips.title} onClose={onClose}>
      <div className="pp">
        <h2>{T.deletedTrips.title}</h2>
        {list === null ? <p className="note">{T.deletedTrips.loading}</p> : null}
        {list?.length === 0 ? <EmptyState title={T.deletedTrips.emptyTitle} text={T.deletedTrips.emptyText} /> : null}
        {list?.map((t) => (
          <div key={t.id} className="seccard">
            <b>{t.name}</b>
            <p className="note">{fill(T.deletedTrips.deletedAt, { when: agoText(t.deletedAt, now) })}</p>
            <Button kind="ghost" block disabled={busy} onClick={() => restore(t)}>{T.deletedTrips.restore}</Button>
          </div>
        ))}
        <Button kind="ghost" block onClick={onClose}>{T.deletedTrips.close}</Button>
      </div>
    </Sheet>
  );
}
