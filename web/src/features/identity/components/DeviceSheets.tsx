import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import type { ApprovalPreview } from '../api/IdentityGateway.ts';
import { useIdentity } from '../hooks/identityContext.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';

/** The confirmation box for revoking a device (no re-authentication needed and it cannot be undone: DR-001 MĐ-5). */
export function RevokeSheet({ deviceId, onClose }: { readonly deviceId: string; readonly onClose: () => void }) {
  const { identity, actions } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const device = identity?.devices.find((d) => d.id === deviceId);
  if (!device) return null;
  /** Revokes on the server; on success it notifies and closes, on failure it reports the error and keeps the sheet to retry. */
  const revoke = (): void => {
    setBusy(true);
    actions.revoke(deviceId).then(() => {
      toast.show(fill(C.security.revoked, { name: device.name }));
      onClose();
    }).catch(report).finally(() => setBusy(false));
  };
  return (
    <Sheet label={fill(C.security.revokeTitle, { name: device.name })} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{fill(C.security.revokeTitle, { name: device.name })}</h2>
          <p className="note spaced">{C.security.revokeText}</p>
        </div>
        <div className="stack">
          <Button kind="danger" block disabled={busy} onClick={revoke}>
            {C.security.revoke}
          </Button>
          <Button kind="ghost" block onClick={onClose}>
            {C.security.cancel}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

/**
 * The sheet for approving a new device or a re-authentication request (S11): enough information to recognize a strange device (a SELF-DECLARED name, unverified), a phishing
 * warning, and the MATCHING NUMBER (DR-018 E1): only choosing exactly the number the other device is showing approves; a wrong choice denies that request for good.
 * The choices are fixed by the server when the request is created (viewing several times does not reveal the real number). The area has no real data yet (B4/E5).
 */
export function PairConfirmSheet({ preview, onClose }: { readonly preview: ApprovalPreview; readonly onClose: () => void }) {
  const { actions } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const name = preview.deviceName ?? C.pair.unnamed;
  /** Choose a number: right approves, wrong and the server denies for good; if the request expires midway it notifies. */
  const choose = (n: number): void => {
    setBusy(true);
    actions.answer(preview, n).then((outcome) => {
      toast.show(outcome === 'approved' ? fill(C.pair.approved, { name }) : C.pair.wrong);
      onClose();
    }).catch((e: unknown) => {
      report(e);
      onClose();
    }).finally(() => setBusy(false));
  };
  /** Actively deny. */
  const deny = (): void => {
    setBusy(true);
    actions.deny(preview).then(() => {
      toast.show(C.pair.denied);
      onClose();
    }).catch(report).finally(() => setBusy(false));
  };
  return (
    <Sheet label={C.pair.confirmTitle} onClose={onClose}>
      <div className="pp">
        <h2>{C.pair.confirmTitle}</h2>
        <div className="seccard">
          <div className="devrow">
            <span className="ib">
              <Icon name="device-mobile" size="l" />
            </span>
            <div>
              <b>{name}</b>
              <span className="note">{fill(C.pair.requested, { ago: agoText(preview.createdAt, now) })}</span>
            </div>
          </div>
          <p className="note">{C.pair.unverified}</p>
          <p className="note">{fill(C.pair.region, { region: C.pair.regionUnknown })}</p>
        </div>
        <WarnBox>{C.pair.warn}</WarnBox>
        <div>
          <h3>{C.pair.matchTitle}</h3>
          <p className="note spaced">{C.pair.matchText}</p>
          <div className="chips" role="group" aria-label={C.pair.matchTitle}>
            {preview.options.map((n) => (
              <button key={n} className="fchip matchnum" type="button" disabled={busy} aria-label={fill(C.pair.choiceAria, { n })} onClick={() => choose(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <Button kind="ghost" block disabled={busy} onClick={deny}>
          {C.pair.deny}
        </Button>
      </div>
    </Sheet>
  );
}
