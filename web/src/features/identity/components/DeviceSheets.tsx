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

/** Hộp xác nhận thu hồi một thiết bị (không cần xác thực lại và không hoàn tác được: DR-001 MĐ-5). */
export function RevokeSheet({ deviceId, onClose }: { readonly deviceId: string; readonly onClose: () => void }) {
  const { identity, actions } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const device = identity?.devices.find((d) => d.id === deviceId);
  if (!device) return null;
  /** Thu hồi ở máy chủ; thành công thì báo và đóng, thất bại thì báo lỗi và giữ tờ để thử lại. */
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
 * Tờ duyệt thiết bị mới hoặc yêu cầu xác thực lại (S11): đủ thông tin để nhận ra thiết bị lạ (tên TỰ KHAI, chưa xác minh), cảnh báo lừa
 * đảo, và SỐ KHỚP (DR-018 E1): chọn đúng số máy kia đang hiện mới được duyệt; chọn sai là từ chối vĩnh viễn yêu cầu đó.
 * Các lựa chọn do máy chủ cố định lúc tạo yêu cầu (xem nhiều lần không lộ số thật). Khu vực chưa có dữ liệu thật (B4/E5).
 */
export function PairConfirmSheet({ preview, onClose }: { readonly preview: ApprovalPreview; readonly onClose: () => void }) {
  const { actions } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());
  const name = preview.deviceName ?? C.pair.unnamed;
  /** Chọn một số: đúng thì duyệt, sai thì máy chủ từ chối vĩnh viễn; yêu cầu hết hạn giữa chừng thì báo. */
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
  /** Từ chối chủ động. */
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
