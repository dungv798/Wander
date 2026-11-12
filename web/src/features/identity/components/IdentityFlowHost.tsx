import { useToast } from '../../../shared/ui/Toast.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { firstIssueSpec } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { Flow } from '../model/identityFlow.types.ts';
import { PairConfirmSheet, RevokeSheet } from './DeviceSheets.tsx';
import { IntroSheet } from './IntroSheet.tsx';
import { IssueCodeSheet } from './IssueCodeSheet.tsx';
import { ReauthSheet } from './ReauthSheet.tsx';

/** The first-save intro sheet (F2) and the code-showing flow that follows it; 'Later' creates an identity without a code and then goes on with the pending action. */
function IntroFlow({ onSaved, replacing }: { readonly onSaved: () => unknown; readonly replacing: boolean }) {
  const { actions, startFlow, closeFlow } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  /** Only creates the identity (no code yet), closes the sheet, runs the pending action and reminds to create a code in Security. */
  const saveLater = (): void => {
    actions.ensureIdentity().then(() => {
      closeFlow();
      // the follow-up action (creating a trip) can take a moment: remind 'no code yet' after it finishes so another notice does not cover it
      // remind only when the follow-up action succeeds (false = an error was already reported; reminding at once would cover the error notice)
      return Promise.resolve(onSaved()).then((ok) => {
        if (ok !== false) toast.show(C.intro.skipSaved);
      }).catch(() => undefined);
    }).catch(report);
  };
  return (
    <IntroSheet
      replacing={replacing}
      onCreate={() => startFlow({
        kind: 'issue',
        issue: firstIssueSpec(actions, {
          onDone: () => {
            closeFlow();
            onSaved();
          },
          onSkip: saveLater,
        }),
      })}
      onLater={saveLater}
      onClose={closeFlow}
    />
  );
}

/** Shows exactly the sheet of the identity flow that is open (one flow at a time). */
export function IdentityFlowHost({ flow }: { readonly flow: Flow }) {
  const { closeFlow } = useIdentity();
  switch (flow.kind) {
    case 'intro':
      return <IntroFlow onSaved={flow.onSaved} replacing={flow.replacing === true} />;
    case 'issue':
      return <IssueCodeSheet issue={flow.issue} onClose={closeFlow} />;
    case 'reauth':
      return <ReauthSheet title={flow.title} why={flow.why} attempt={flow.attempt} onClose={closeFlow} />;
    case 'revoke':
      return <RevokeSheet deviceId={flow.deviceId} onClose={closeFlow} />;
    case 'pairConfirm':
      return <PairConfirmSheet preview={flow.preview} onClose={closeFlow} />;
  }
}
