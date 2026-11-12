import { COPY } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { permissionsOf } from '../model/tripPermissions.ts';
import { SHARE_COPY as C } from '../model/share.copy.ts';

/** Choose how to share before leaving the schedule: collaboration with permissions or sending a static image, so the two actions are not confused. */
export function ShareSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, setOverlay } = useTripView();
  const invite = permissionsOf(trip).manageTrip;
  return <Sheet label={C.title} onClose={onClose}>
    <div className="pp share-options">
      <h2>{C.title}</h2>
      <p className="note">{C.description}</p>
      <Button kind="ghost" icon="users" arrow className="share-choice" onClick={() => setOverlay({ kind: 'people' })}><span><b>{invite ? C.invite : C.members}</b><small>{invite ? C.inviteNote : C.membersNote}</small></span></Button>
      <Button kind="ghost" icon="share-2" arrow className="share-choice" onClick={() => { onClose(); navigate(VIEW.EXPORT, trip.id); }}><span><b>{C.image}</b><small>{C.imageNote}</small></span></Button>
      <Button kind="ghost" onClick={onClose}>{COPY.common.close}</Button>
    </div>
  </Sheet>;
}
