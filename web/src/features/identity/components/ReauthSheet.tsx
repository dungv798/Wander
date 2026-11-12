import { useEffect, useRef, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import type { StepUpRequested } from '../api/IdentityGateway.ts';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { replacementSession } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { ReauthAttempt } from '../model/identityFlow.types.ts';

interface ReauthProps {
  readonly title: string;
  readonly why: string;
  /** Tries one piece of evidence; returns true when authentication is done (the next flow has opened), false when it is not enough (wrong code, not approved yet). */
  readonly attempt: ReauthAttempt;
  readonly onClose: () => void;
}

type Mode = 'device' | 'code';

/** Re-authenticates with the RECOVERY CODE: more than 5 wrong attempts on this device lock it temporarily (D23); the wrong-code message is always generic and never says how many attempts are left. */
function CodeMode({ attempt }: { readonly attempt: ReauthAttempt }) {
  const report = useReportError();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, failed, fail, reset } = useAttemptLock('reauth');
  /** Sends the code as evidence; if wrong it counts the attempt, if right the next flow has opened. */
  const verify = (): void => {
    setBusy(true);
    attempt({ type: 'code', code: value })
      .then((ok) => (ok ? reset() : fail()))
      .catch(report)
      .finally(() => setBusy(false));
  };
  return (
    <>
      <Field code label={C.reauth.codeLabel} value={value} onChange={setValue} disabled={locked} hint={C.reauth.codeHelp} />
      {failed || locked ? <WarnBox>{locked ? C.reauth.locked : C.reauth.wrong}</WarnBox> : null}
      <Button block disabled={locked || busy} onClick={verify}>
        {C.reauth.verify}
      </Button>
    </>
  );
}

/**
 * Re-authenticates with ANOTHER TRUSTED DEVICE (DR-018 E1): this device shows an approval code + the matching number; the other device types the code under 'Add a new device'
 * and then chooses the right number. This device asks again every second until it is approved or the code expires (5 minutes).
 */
function DeviceMode({ attempt }: { readonly attempt: ReauthAttempt }) {
  const { actions } = useIdentity();
  const report = useReportError();
  const [request, setRequest] = useState<StepUpRequested | null>(null);
  const [expired, setExpired] = useState(false);
  const [busy, setBusy] = useState(false);
  const finished = useRef(false);

  /** Asks the server for a new approval code. */
  const send = (): void => {
    setBusy(true);
    setExpired(false);
    actions.requestStepUp().then(setRequest).catch(report).finally(() => setBusy(false));
  };

  useEffect(() => {
    if (!request) return undefined;
    finished.current = false;
    let inFlight = false; // if the previous call has not returned, do not call on top of it (avoids issuing two codes at the same time)
    const timer = window.setInterval(() => {
      if (finished.current || inFlight) return;
      if (Date.now() > request.expiresAt) {
        finished.current = true;
        setRequest(null);
        setExpired(true);
        return;
      }
      inFlight = true;
      attempt({ type: 'approval', requestId: request.requestId }).then((ok) => {
        if (ok) finished.current = true;
      }).catch(() => undefined).finally(() => {
        inFlight = false;
      });
    }, IDENTITY.POLL_MS);
    return () => {
      finished.current = true;
      window.clearInterval(timer);
    };
  }, [request, attempt]);

  if (!request) {
    return (
      <>
        {expired ? <WarnBox>{C.reauth.expired}</WarnBox> : null}
        <Button block disabled={busy} onClick={send}>{C.reauth.send}</Button>
      </>
    );
  }
  return (
    <>
      <p className="note">{fill(C.reauth.deviceText, { code: PairingCode.parse(request.approvalCode)?.format() ?? request.approvalCode, n: request.number })}</p>
      <div className="pairbox">
        <b className="pcode big">{PairingCode.parse(request.approvalCode)?.format() ?? request.approvalCode}</b>
        <span className="note">{C.recover.numberLabel}</span>
        <b className="pcode big">{request.number}</b>
      </div>
      <div className="waitbox" role="status">
        <span className="spin" aria-hidden="true" />
        {C.reauth.waiting}
      </div>
    </>
  );
}

/** The re-authentication sheet (S12) for a sensitive action: choose another trusted device or the recovery code; each action needs its own authentication. */
export function ReauthSheet({ title, why, attempt, onClose }: ReauthProps) {
  const { identity, actions, startFlow, closeFlow } = useIdentity();
  const report = useReportError();
  const others = (identity?.devices ?? []).filter((d) => !d.current);
  const canCode = identity?.hasCode === true;
  const [mode, setMode] = useState<Mode>(others.length ? 'device' : 'code');
  /** No code and no other device yet: allows creating the first code (no evidence needed because there is no current code, MĐ-2). */
  const issueFirst = (): void =>
    startFlow({
      kind: 'issue',
      issue: { purpose: 'regen', open: async () => replacementSession(actions, await actions.beginReplacement()), onDone: closeFlow, onOpenFailed: report },
    });
  return (
    <Sheet label={title} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{title}</h2>
          <p className="note spaced">{`${why} ${C.reauth.note}`}</p>
        </div>
        {!canCode && !others.length ? (
          <>
            <WarnBox>{C.reauth.needCode}</WarnBox>
            <Button block onClick={issueFirst}>
              {C.reauth.issueFirst}
            </Button>
          </>
        ) : (
          <>
            <div className="chips" role="group" aria-label={C.reauth.modes}>
              {others.length ? <ChipToggle pressed={mode === 'device'} onClick={() => setMode('device')}>{C.reauth.modeDevice}</ChipToggle> : null}
              {canCode ? <ChipToggle pressed={mode === 'code'} onClick={() => setMode('code')}>{C.reauth.modeCode}</ChipToggle> : null}
            </div>
            {mode === 'device' && others.length ? <DeviceMode attempt={attempt} /> : <CodeMode attempt={attempt} />}
          </>
        )}
        <Button kind="ghost" block onClick={onClose}>
          {C.reauth.cancel}
        </Button>
      </div>
    </Sheet>
  );
}
