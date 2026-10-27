import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { ServerIdentity } from '../model/identity.types.ts';
import { findPairing, hasCode } from '../model/identityServer.ts';

const MINUTE_TICK_MS = 30_000;

/** Mục "Mã khôi phục": đã có mã (tạo mã mới cần xác thực lại) hoặc chưa có (cảnh báo nhẹ và cho tạo ngay, MĐ-2). Mã không bao giờ hiện lại. */
export function CodeSection() {
  const { server, actions, startFlow, closeFlow } = useIdentity();
  const issue = (purpose: 'first' | 'regen'): void => startFlow({ kind: 'issue', issue: { purpose, onCommit: actions.commitCode, onDone: closeFlow } });
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.codeTitle}</h2>
      {hasCode(server) ? (
        <>
          <p className="note">
            <Icon name="check" size="s" />
            {C.security.codeHas}
          </p>
          <Button kind="ghost" block icon="key" onClick={() => startFlow({ kind: 'reauth', title: C.reauth.regenTitle, why: C.reauth.regenWhy, onOk: () => issue('regen') })}>
            {C.security.codeRegen}
          </Button>
        </>
      ) : (
        <>
          <WarnBox>{C.security.codeNone}</WarnBox>
          <Button block icon="key" onClick={() => issue('first')}>
            {C.security.codeIssue}
          </Button>
        </>
      )}
    </section>
  );
}

/** Mục "Thiết bị tin cậy": máy này ghi "Đang dùng"; các máy khác có nút Thu hồi (không cần xác thực lại). */
export function DevicesSection({ identity, deviceId }: { readonly identity: ServerIdentity; readonly deviceId: string | null }) {
  const { startFlow } = useIdentity();
  const now = useNow(MINUTE_TICK_MS);
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.devicesTitle}</h2>
      <p className="note">{C.security.devicesNote}</p>
      {identity.devices.map((d) => (
        <div key={d.id} className="devrow">
          <span className="ib">
            <Icon name="device-mobile" size="l" />
          </span>
          <div>
            <b>{d.name}</b>
            <span className="note">{d.id === deviceId ? C.security.current : fill(C.security.lastActive, { ago: agoText(d.at, now) })}</span>
          </div>
          {d.id === deviceId ? null : (
            <Button kind="ghost" aria-label={fill(C.security.revokeAria, { name: d.name })} onClick={() => startFlow({ kind: 'revoke', deviceId: d.id })}>
              {C.security.revoke}
            </Button>
          )}
        </div>
      ))}
    </section>
  );
}

/** Mục "Hoạt động gần đây": tối đa 8 dòng mới nhất, mỗi dòng có "x phút trước". */
export function ActivitySection({ identity }: { readonly identity: ServerIdentity }) {
  const now = useNow(MINUTE_TICK_MS);
  return (
    <section className="seccard">
      <h2 className="h2">{C.security.activityTitle}</h2>
      {identity.events.length ? (
        <ul className="evlist">
          {identity.events.slice(0, IDENTITY.SHOWN_EVENTS).map((e) => (
            <li key={`${e.at}-${e.kind}`}>
              <span>{fill(C.security.events[e.kind], { device: e.device ?? '' })}</span>
              <span className="note">{agoText(e.at, now)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="note">{C.security.activityNone}</p>
      )}
      <p className="note">{C.security.activityHint}</p>
    </section>
  );
}

/** Mục "Thêm thiết bị mới": nhập mã ghép XXXX-XXXX hiện trên máy mới; đúng thì mở tờ duyệt (có số khớp). Sai quá 5 lần ở máy này thì khóa tạm. */
export function PairSection() {
  const { server, startFlow } = useIdentity();
  const [value, setValue] = useState('');
  const { locked, failed, fail, reset } = useAttemptLock('pair');
  /** Tra mã; đúng thì mở tờ duyệt, sai/hết hạn thì đếm lần thử (bền, khóa tạm khi sai đủ 5 lần). */
  const submit = (): void => {
    const r = findPairing(server, value, Date.now());
    if (r.result === 'found') {
      reset();
      startFlow({ kind: 'pairConfirm', pairing: r.pairing });
    } else fail();
  };
  return (
    <section className="seccard">
      <h2 className="h2">{C.pair.title}</h2>
      <p className="note">{C.pair.text}</p>
      <Field code label={C.pair.label} value={value} onChange={setValue} placeholder={C.pair.placeholder} disabled={locked} hint={C.pair.help} />
      {failed || locked ? <WarnBox>{locked ? C.pair.locked : C.pair.bad}</WarnBox> : null}
      <Button block disabled={locked} onClick={submit}>
        {C.pair.next}
      </Button>
    </section>
  );
}

/** Hộp "BẢN THỬ" (chỉ khi phát triển): thay cho một thiết bị khác thật để thử luồng ghép/khôi phục khi chưa có máy chủ. */
export function DemoBox() {
  const { server, actions } = useIdentity();
  if (!IS_DEV) return null;
  const p = server.pairing;
  return (
    <section className="protobox">
      <b>{C.demo.title}</b>
      <p className="note">{C.demo.note}</p>
      {p && p.status === 'waiting' ? <p className="note">{fill(C.demo.newDeviceShown, { code: PairingCode.parse(p.code)?.format() ?? p.code, number: p.number })}</p> : null}
      <Button kind="ghost" onClick={() => actions.requestPairing()}>
        {C.demo.newDevice}
      </Button>
      <Button kind="ghost" onClick={() => actions.addDemoDevice(C.demo.otherDeviceName)}>
        {C.demo.otherDevice}
      </Button>
      <Button kind="ghost" onClick={actions.loseSession}>
        {C.demo.lostData}
      </Button>
    </section>
  );
}
