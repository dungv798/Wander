import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY as C, collabGateway, useLoaded } from '../../collab/index.ts';
import type { DeletionRequest } from '../../collab/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { itemName } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';

/** The status label of a request (Q9: the requester sees 'Rejected', with no reason). */
function statusLabel(r: DeletionRequest): string {
  return r.status === 'pending' ? C.requests.pending : r.status === 'approved' ? C.requests.approved : C.requests.rejected;
}

/** The deletion-request list sheet: the Organizer sees every request and Approve/Reject; a member sees their own requests (and can cancel while pending). */
export function RequestsSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, cat } = useTripView();
  const { actions } = useTrips();
  const perms = permissionsOf(trip);
  const toast = useToast();
  const report = useReportError();
  const list = useLoaded(() => collabGateway.requests(trip.id), [trip.id]);
  const [busy, setBusy] = useState(false);
  const nameOf = (itemId: string): string => {
    const item = trip.items.find((i) => i.id === itemId) ?? trip.trash.find((e) => e.item.id === itemId)?.item;
    return item ? itemName(item, cat) : C.requests.itemGone;
  };
  const run = (work: Promise<unknown>): void => {
    setBusy(true);
    work.then(async () => {
      toast.show(C.requests.decided);
      await actions.refreshTrip(trip.id);
    }).catch(report).finally(() => {
      list.reload();
      setBusy(false);
    });
  };
  const title = perms.organizer ? C.requests.title : C.requests.titleMine;
  return (
    <Sheet label={title} onClose={onClose}>
      <div className="pp">
        <h2>{title}</h2>
        {list.data?.length === 0 ? <EmptyState title={C.requests.empty} text="" /> : null}
        {!list.data && list.error ? <WarnBox>{C.people.loadFail}<Button kind="ghost" onClick={list.reload}>{C.people.retry}</Button></WarnBox> : null}
        {list.data?.map((r) => (
          <section key={r.id} className="seccard">
            <b>{perms.organizer ? fill(r.requesterName ? C.requests.from : C.requests.fromGone, { name: r.requesterName ?? '', item: nameOf(r.itemId) }) : fill(C.requests.mine, { item: nameOf(r.itemId) })}</b>
            {r.reason ? <p className="note">{fill(C.requests.reason, { reason: r.reason })}</p> : null}
            <p className="note">{statusLabel(r)}</p>
            {r.status === 'pending' && perms.organizer ? (
              <>
                <Button block disabled={busy} onClick={() => run(collabGateway.approveRequest(trip.id, r.id))}>{C.requests.approve}</Button>
                <Button kind="ghost" block disabled={busy} onClick={() => run(collabGateway.rejectRequest(trip.id, r.id))}>{C.requests.reject}</Button>
              </>
            ) : null}
            {r.status === 'pending' && !perms.organizer ? (
              <Button kind="ghost" block disabled={busy} onClick={() => run(collabGateway.cancelRequest(trip.id, r.id))}>{C.requests.cancel}</Button>
            ) : null}
          </section>
        ))}
        <Button kind="ghost" block onClick={onClose}>{C.requests.close}</Button>
      </div>
    </Sheet>
  );
}

/** The sheet to send a request to delete someone else's item (the reason is optional). */
export function RequestDeleteSheet({ itemId, onClose }: { readonly itemId: string; readonly onClose: () => void }) {
  const { trip, cat } = useTripView();
  const toast = useToast();
  const report = useReportError();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const item = trip.items.find((i) => i.id === itemId);
  if (!item) return null;
  const name = itemName(item, cat);
  const send = (): void => {
    setBusy(true);
    collabGateway.submitRequest(trip.id, itemId, reason).then(() => {
      toast.show(C.requests.sent);
      onClose();
    }).catch(report).finally(() => setBusy(false));
  };
  return (
    <Sheet label={fill(C.requests.sheetTitle, { item: name })} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{fill(C.requests.sheetTitle, { item: name })}</h2>
          <p className="note spaced">{C.requests.sheetText}</p>
        </div>
        <Field label={C.requests.reasonLabel} value={reason} onChange={setReason} maxLength={LIMITS.MAX_REQUEST_REASON} />
        <Button block disabled={busy} onClick={send}>{C.requests.send}</Button>
        <Button kind="ghost" block onClick={onClose}>{C.people.cancel}</Button>
      </div>
    </Sheet>
  );
}
