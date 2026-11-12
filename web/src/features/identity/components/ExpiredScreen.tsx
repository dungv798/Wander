import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { expiredBranch } from '../model/identitySnapshot.ts';

/**
 * The session-ended screen (S19) when the server no longer accepts this device's session (revoked from elsewhere). Two branches by what was last known:
 * A there is still a code or another device -> 'Open on this device'; B there is nothing left to recover -> says plainly that it cannot be recovered (D20, D26).
 * It states no session lifetime (not decided yet).
 */
export function ExpiredScreen() {
  const { session, actions } = useIdentity();
  const branch = expiredBranch(session.known);
  /** Forgets this device's old session and then goes to another screen. */
  const leave = (to: typeof VIEW.RECOVER | typeof VIEW.EXPLORE): void => {
    actions.loseSession();
    navigate(to);
  };
  return (
    <EmptyState
      pageTitle
      role="alert"
      icon="key"
      title={branch === 'A' ? C.expired.title : C.expired.titleB}
      text={branch === 'A' ? C.expired.textA : C.expired.textB}
      actions={
        <>
          {branch === 'A' ? <Button onClick={() => leave(VIEW.RECOVER)}>{C.expired.open}</Button> : null}
          <Button kind={branch === 'A' ? 'ghost' : 'primary'} onClick={() => leave(VIEW.EXPLORE)}>
            {C.expired.home}
          </Button>
        </>
      }
    />
  );
}
