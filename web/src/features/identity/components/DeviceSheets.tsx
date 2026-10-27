import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { PairingRequest } from '../model/identity.types.ts';
import { matchChoices } from '../model/identityServer.ts';


/** Hộp xác nhận thu hồi một thiết bị (không cần xác thực lại và không hoàn tác được: DR-001 MĐ-5). */
export function RevokeSheet({ deviceId, onClose }: { readonly deviceId: string; readonly onClose: () => void }) {
  const { identity, actions } = useIdentity();
  const toast = useToast();
  const device = identity?.devices.find((d) => d.id === deviceId);
  if (!device) return null;
  return (
    <Sheet label={fill(C.security.revokeTitle, { name: device.name })} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{fill(C.security.revokeTitle, { name: device.name })}</h2>
          <p className="note spaced">{C.security.revokeText}</p>
        </div>
        <div className="stack">
          <Button
            kind="danger"
            block
            onClick={() => {
              actions.revoke(deviceId);
              toast.show(fill(C.security.revoked, { name: device.name }));
              onClose();
            }}
          >
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
 * Tờ duyệt thiết bị mới (S11): đủ thông tin để nhận ra thiết bị lạ, cảnh báo lừa đảo, và SỐ KHỚP (DR-018 E1): chọn đúng số máy mới đang hiện
 * mới được duyệt; chọn sai là từ chối. Khu vực chỉ hiện ở màn này, không lưu (B4/E5); bản thử chưa có dữ liệu thật.
 */
export function PairConfirmSheet({ pairing, onClose }: { readonly pairing: PairingRequest; readonly onClose: () => void }) {
  const { actions } = useIdentity();
  const toast = useToast();
  const [choices] = useState(() => matchChoices(pairing.number));
  const [now] = useState(() => Date.now());
  /** Chọn một số: đúng thì duyệt, sai thì từ chối; yêu cầu hết hạn giữa chừng thì báo. */
  const choose = (n: number | null): void => {
    const outcome = actions.answerPairing(n);
    toast.show(outcome === 'approved' ? fill(C.pair.approved, { name: pairing.name }) : C.pair[outcome === 'expired' ? 'expired' : outcome === 'wrong' ? 'wrong' : 'denied']);
    onClose();
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
              <b>{pairing.name}</b>
              <span className="note">{fill(C.pair.requested, { ago: agoText(pairing.at, now) })}</span>
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
            {choices.map((n) => (
              <button key={n} className="fchip matchnum" type="button" aria-label={fill(C.pair.choiceAria, { n })} onClick={() => choose(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <Button kind="ghost" block onClick={() => choose(null)}>
          {C.pair.deny}
        </Button>
      </div>
    </Sheet>
  );
}
