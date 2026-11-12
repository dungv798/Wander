import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { goBack, navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { RetryState } from './SecurityScreenContent.tsx';
import { recoverySession } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { startPairingPoll } from '../model/pairingPoll.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { PairingRequest } from '../model/identity.types.ts';

type Mode = 'code' | 'device';

/** The backend error code when the recovery code is wrong, already used or no longer valid (one common code, MĐ-8). */
const WRONG_CODE_ERRORS: readonly string[] = ['INVALID_CODE', 'CODE_ALREADY_USED', 'INVALID_ATTEMPT'];

/**
 * Recovery by CODE: the server checks the code, and if right it generates a replacement code (it may NOT be skipped) and 2 groups must be typed again; the old code only stops being valid
 * when the new code is confirmed (QĐ-6). When the attempt expires (15 minutes) it starts over.
 */
function CodeRecover() {
  const { actions, startFlow, closeFlow } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, failed, fail, reset } = useAttemptLock('recover');
  /** Sends the code to the server; if right it opens the replacement-code flow, if wrong it counts the attempt (persistent, temporarily locked after 5 wrong attempts). */
  const submit = (): void => {
    if (!RecoveryCode.parse(value)) {
      fail();
      return;
    }
    setBusy(true);
    actions.startRecovery(value).then((attempt) => {
      reset();
      setValue(''); // the code has not been consumed: do not leave it in the input box
      startFlow({
        kind: 'issue',
        issue: {
          purpose: 'recover',
          open: async () => recoverySession(actions, attempt),
          onOpenFailed: report,
          onExpired: () => {
            closeFlow();
            toast.show(C.recover.attemptExpired);
          },
          onDone: () => {
            closeFlow();
            toast.show(C.recover.recovered);
            navigate(VIEW.TRIPS);
          },
        },
      });
    }).catch((e: unknown) => {
      if (e instanceof ApiError && WRONG_CODE_ERRORS.includes(e.code)) fail();
      else report(e);
    }).finally(() => setBusy(false));
  };
  return (
    <>
      <Field code label={C.recover.codeLabel} value={value} onChange={setValue} disabled={locked} hint={C.recover.codeHelp} />
      {failed || locked ? <WarnBox>{locked ? C.recover.locked : C.recover.wrong}</WarnBox> : null}
      <Button block disabled={locked || busy} onClick={submit}>
        {C.recover.next}
      </Button>
    </>
  );
}

/** The result of asking the status of the pairing request waiting on this device. */
type Outcome = 'denied' | 'expired' | null;

/**
 * Asks the status of the pairing request every second until it is approved (this device receives the session and goes to the trip list), denied or expired
 * (clears the request and reports the result). It receives the session only ONCE even if React runs the effect twice.
 */
function usePairingPoll(request: PairingRequest | null, setRequest: (r: PairingRequest | null) => void, setOutcome: (o: Outcome) => void): void {
  const { actions } = useIdentity();
  const toast = useToast();
  const [joined] = useState(() => ({ done: false }));
  const report = useReportError();
  useEffect(() => {
    if (!request) return undefined;
    const stop = startPairingPoll({
      expiresAt: request.expiresAt,
      readStatus: (signal) => actions.pairingStatus(request, signal),
      approved: async () => {
        if (joined.done) return;
        joined.done = true; // receives the session only once, even when the effect is rebuilt
        await actions.joinHere(request);
        // Do NOT block on `disposed` here: receiving the session changes the identity so this very screen is removed, but the toast and the navigation must still run.
        toast.show(C.recover.recovered);
        navigate(VIEW.TRIPS);
      },
      finish: (status) => { setRequest(null); setOutcome(status); },
      report,
      joinFailed: () => { joined.done = false; setRequest(null); },
    });
    return () => { stop(); };
  }, [request, actions, toast, joined, report, setRequest, setOutcome]);
}

/**
 * Recovery by an OLD DEVICE APPROVING (DR-018 E1): this device shows a pairing code + a matching number issued by the server and asks again every second; when the old device chooses
 * the right number, this device becomes a trusted device. The session secret is generated by this device itself and takes effect only after approval.
 */
function DeviceRecover() {
  const { actions } = useIdentity();
  const report = useReportError();
  const [request, setRequest] = useState<PairingRequest | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [limited, setLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Asks for a new pairing code; null means the request limit was exceeded (3 per 10 minutes). */
  const show = (): void => {
    setBusy(true);
    setOutcome(null);
    setLimited(false);
    actions.requestPairing().then((r) => (r ? setRequest(r) : setLimited(true))).catch(report).finally(() => setBusy(false));
  };

  usePairingPoll(request, setRequest, setOutcome);

  if (!request) {
    return (
      <>
        <p className="note">{C.recover.deviceText}</p>
        {outcome === 'denied' ? <WarnBox>{C.recover.denied}</WarnBox> : null}
        {outcome === 'expired' ? <WarnBox>{C.recover.expired}</WarnBox> : null}
        {limited ? <WarnBox>{C.recover.limit}</WarnBox> : null}
        <Button block disabled={busy} onClick={show}>
          {C.recover.show}
        </Button>
      </>
    );
  }
  return (
    <>
      <div className="pairbox">
        <span className="note">{C.recover.pairLabel}</span>
        <b className="pcode big">{PairingCode.parse(request.code)?.format() ?? request.code}</b>
        <span className="note">{C.recover.numberLabel}</span>
        <b className="pcode big">{request.number}</b>
        <span className="note">{C.recover.pairHint}</span>
      </div>
      <div className="waitbox" role="status">
        <span className="spin" aria-hidden="true" />
        {C.recover.waiting}
      </div>
    </>
  );
}

/** The 'Open the trip on this device' screen (S13) for a person who already used Wander on another device: by recovery code or by an old device approving. A device that already has an identity is only pointed to Security. */
export function RecoverScreen() {
  const { identity, status } = useIdentity();
  const [mode, setMode] = useState<Mode>('code');
  // loading or could not load: the device may still have a usable session, so recovery is not allowed yet (it would overwrite that session)
  if (status === 'loading' || status === 'error') return <RetryState />;
  if (identity) {
    return <EmptyState title={C.recover.already} text="" actions={<Button onClick={() => navigate(VIEW.SECURITY)}>{C.recover.alreadyAction}</Button>} />;
  }
  return (
    <>
      <div className="pagehead pad-x">
        <div>
          <IconButton icon="chevron-left" label={C.recover.back} onClick={goBack} />
        </div>
        <p className="note">{C.recover.eyebrow}</p>
        <h1>{C.recover.title}</h1>
        <p className="note">{C.recover.lead}</p>
      </div>
      <div className="stack pad-x spaced-lg">
        <div className="chips" role="group" aria-label={C.recover.modes}>
          <ChipToggle pressed={mode === 'code'} onClick={() => setMode('code')}>{C.recover.modeCode}</ChipToggle>
          <ChipToggle pressed={mode === 'device'} onClick={() => setMode('device')}>{C.recover.modeDevice}</ChipToggle>
        </div>
        {mode === 'code' ? <CodeRecover /> : <DeviceRecover />}
      </div>
    </>
  );
}
