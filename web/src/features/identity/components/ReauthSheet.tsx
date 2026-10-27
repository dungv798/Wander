import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { checkCode, hasCode, newMatchNumber } from '../model/identityServer.ts';

interface ReauthProps {
  readonly title: string;
  readonly why: string;
  /** Chạy sau khi xác thực lại thành công (tờ này đã đóng). */
  readonly onOk: () => void;
  readonly onClose: () => void;
}

type Mode = 'device' | 'code';

/** Xác thực lại bằng MÃ KHÔI PHỤC: sai quá 5 lần ở máy này thì khóa tạm (D23); thông báo sai luôn chung, không nói còn mấy lần. */
function CodeMode({ onVerified }: { readonly onVerified: () => void }) {
  const { server } = useIdentity();
  const [value, setValue] = useState('');
  const { locked, failed, fail, reset } = useAttemptLock('reauth');
  return (
    <>
      <Field code label={C.reauth.codeLabel} value={value} onChange={setValue} disabled={locked} hint={C.reauth.codeHelp} />
      {failed || locked ? <WarnBox>{locked ? C.reauth.locked : C.reauth.wrong}</WarnBox> : null}
      <Button
        block
        disabled={locked}
        onClick={() => {
          if (checkCode(server, value)) {
            reset();
            onVerified();
          } else fail();
        }}
      >
        {C.reauth.verify}
      </Button>
    </>
  );
}

/** Xác thực lại bằng THIẾT BỊ TIN CẬY KHÁC: hiện số khớp, chờ thiết bị kia chọn đúng số (bản thử: nút giả lập, chỉ có khi phát triển). */
function DeviceMode({ deviceName, onApproved }: { readonly deviceName: string; readonly onApproved: () => void }) {
  const [number] = useState(() => newMatchNumber());
  const [state, setState] = useState<'idle' | 'sent' | 'denied'>('idle');
  return (
    <>
      <p className="note">{fill(C.reauth.deviceText, { name: deviceName, n: number })}</p>
      {state === 'idle' ? <Button block onClick={() => setState('sent')}>{C.reauth.send}</Button> : null}
      {state === 'sent' ? (
        <div className="waitbox" role="status">
          <span className="spin" aria-hidden="true" />
          {fill(C.reauth.waiting, { name: deviceName })}
        </div>
      ) : null}
      {state === 'denied' ? <WarnBox>{C.reauth.denied}</WarnBox> : null}
      {IS_DEV && state === 'sent' ? (
        <div className="protobox">
          <b>{C.demo.title}</b>
          <p className="note">{C.demo.note}</p>
          <Button onClick={onApproved}>{C.demo.reauthApprove}</Button>
          <Button kind="ghost" onClick={() => setState('denied')}>{C.demo.reauthDeny}</Button>
        </div>
      ) : null}
    </>
  );
}

/** Tờ xác thực lại (S12) cho thao tác nhạy cảm: chọn thiết bị tin cậy khác hoặc mã khôi phục; mỗi thao tác cần một lần xác thực riêng. */
export function ReauthSheet({ title, why, onOk, onClose }: ReauthProps) {
  const { server, session, identity, actions, startFlow, closeFlow } = useIdentity();
  const others = (identity?.devices ?? []).filter((d) => d.id !== session.deviceId);
  const canCode = hasCode(server);
  const [mode, setMode] = useState<Mode>(others.length ? 'device' : 'code');
  /** Thành công: đóng tờ rồi chạy thao tác đang chờ. */
  const done = (): void => {
    closeFlow();
    onOk();
  };
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
            <Button block onClick={() => startFlow({ kind: 'issue', issue: { purpose: 'regen', onCommit: actions.commitCode, onDone: closeFlow } })}>
              {C.reauth.issueFirst}
            </Button>
          </>
        ) : (
          <>
            <div className="chips" role="group" aria-label={C.reauth.modes}>
              {others.length ? <ChipToggle pressed={mode === 'device'} onClick={() => setMode('device')}>{C.reauth.modeDevice}</ChipToggle> : null}
              {canCode ? <ChipToggle pressed={mode === 'code'} onClick={() => setMode('code')}>{C.reauth.modeCode}</ChipToggle> : null}
            </div>
            {mode === 'device' && others[0] ? <DeviceMode deviceName={others[0].name} onApproved={done} /> : <CodeMode onVerified={done} />}
          </>
        )}
        <Button kind="ghost" block onClick={onClose}>
          {C.reauth.cancel}
        </Button>
      </div>
    </Sheet>
  );
}
