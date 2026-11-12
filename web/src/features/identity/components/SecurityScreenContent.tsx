import { useEffect, useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { goBack, navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { ActivitySection, CodeSection, DevicesSection, PairSection } from './SecuritySections.tsx';

/** The head of the Security page: back to the previous screen, or to Discover when the URL was opened directly. */
function SecurityHead() {
  return (
    <div className="pagehead pad-x">
      <div>
        <IconButton icon="chevron-left" label={C.security.back} onClick={goBack} />
      </div>
      <p className="note">{C.security.eyebrow}</p>
      <h1>{C.security.title}</h1>
      <p className="note">{C.security.lead}</p>
    </div>
  );
}

/** The identity could not be loaded (network): do NOT treat it as having no identity; allow a retry. */
export function RetryState() {
  const { actions } = useIdentity();
  return (
    <>
      <SecurityHead />
      <EmptyState title={C.security.errorTitle} text={C.security.errorText} actions={<Button onClick={() => void actions.refresh()}>{C.security.retry}</Button>} />
    </>
  );
}

/** The Security screen (S11): the recovery-code status, trusted devices, recent activity, add a new device. With no identity yet it says so plainly and leads on. */
export function SecurityScreen() {
  const { status, identity, session, actions } = useIdentity();
  const [hadUnseen, setHadUnseen] = useState(false);
  const [wasRecovered] = useState(() => session.recovered);
  const unseen = identity?.unseen === true;
  const here = identity !== null;
  // Remembers that THIS OPEN has unseen activity (to show the reminder box) and then marks it seen on the server.
  if (unseen && !hadUnseen) setHadUnseen(true);
  useEffect(() => {
    if (unseen) void actions.markSeen().catch(() => undefined);
  }, [unseen, actions]);
  useEffect(() => {
    if (here) actions.ackRecovered();
  }, [here, actions]);
  if (status === 'loading') return <SecurityHead />;
  if (status === 'error') return <RetryState />;
  if (!identity) {
    return (
      <>
        <SecurityHead />
        <EmptyState
          title={C.security.noneTitle}
          text={C.security.noneText}
          actions={
            <>
              <Button onClick={() => navigate(VIEW.EXPLORE)}>{C.security.noneAction}</Button>
              <Button kind="ghost" onClick={() => navigate(VIEW.RECOVER)}>
                {C.recover.title}
              </Button>
            </>
          }
        />
      </>
    );
  }
  return (
    <>
      <SecurityHead />
      <div className="stack pad-x spaced-lg">
        {hadUnseen ? (
          <div className="infobox" role="status">
            <b>{C.security.unseenTitle}</b>
            <p>{C.security.unseenText}</p>
          </div>
        ) : null}
        {wasRecovered ? (
          <div className="infobox" role="status">
            <b>{C.security.recoveredTitle}</b>
            <p>{C.security.recoveredText}</p>
          </div>
        ) : null}
        <CodeSection />
        <DevicesSection identity={identity} />
        <ActivitySection identity={identity} />
        <PairSection />
      </div>
    </>
  );
}
