import { useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useResource } from '../../../shared/hooks/useResource.ts';
import { replaceRoute } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { COLLAB_COPY as C, collabGateway } from '../../collab/index.ts';
import { useIdentity, useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';

/** The server error code for every invite link that cannot be used (expired, revoked, wrong): one common message that does not reveal the reason. */
const INVALID_INVITE = 'INVALID_INVITE';

/**
 * The screen to join a trip by invite link `#/join/<code>`: previews the trip name, asks for a display name, then joins. The code lives only in the address (after the #),
 * is stored nowhere else, and is removed from the address as soon as the join finishes or the screen is left. A device with no identity yet creates an anonymous identity first (H1).
 */
export function JoinScreen({ code }: { readonly code: string }) {
  const toast = useToast();
  const report = useReportError();
  const { actions: identity } = useIdentity();
  const { reload } = useTrips();
  const preview = useResource(() => collabGateway.preview(code), [code]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const home = (): void => replaceRoute(VIEW.EXPLORE);
  const join = (): void => {
    setBusy(true);
    identity.ensureIdentity()
      .then(() => collabGateway.join(code, name))
      .then((joined) => {
        toast.show(fill(C.join.joined, { name: preview.state.status === 'ready' ? preview.state.data.tripName : '' }));
        reload();
        replaceRoute(VIEW.TRIP, joined.tripId);
      })
      .catch((e: unknown) => {
        report(e);
        setBusy(false);
      });
  };
  if (preview.state.status === 'loading') return <EmptyState pageTitle role="status" icon="users" title={C.join.checking} text="" />;
  if (preview.state.status === 'error') {
    const invalid = preview.state.error instanceof ApiError && preview.state.error.code === INVALID_INVITE;
    return (
      <EmptyState
        pageTitle
        role="alert"
        icon="alert-triangle"
        title={invalid ? C.join.invalidTitle : C.join.errorText}
        text={invalid ? C.join.invalidText : ''}
        actions={
          <>
            {invalid ? null : <Button onClick={preview.retry}>{C.join.retry}</Button>}
            <Button kind={invalid ? 'primary' : 'ghost'} onClick={home}>{C.join.toHome}</Button>
          </>
        }
      />
    );
  }
  const { tripName, memberCount } = preview.state.data;
  return (
    <section className="stack">
      <div className="pagehead pad-x">
        <p className="note">{fill(C.join.invitedTo, { name: tripName })} · {fill(C.join.members, { n: memberCount })}</p>
        <h1>{C.join.title}</h1>
      </div>
      <div className="pad-x stack">
      <Field label={C.join.nameLabel} hint={C.join.nameHelp} value={name} onChange={setName} maxLength={LIMITS.MAX_DISPLAY_NAME} />
      <Button block disabled={busy || !name.trim()} onClick={join}>{C.join.join}</Button>
      <Button kind="ghost" block onClick={home}>{C.join.toHome}</Button>
      </div>
    </section>
  );
}
