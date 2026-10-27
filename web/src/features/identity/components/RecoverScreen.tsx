import { useEffect, useRef, useState } from 'react';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { IS_DEV } from '../../../shared/const/env.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { useNow } from '../../../shared/hooks/useNow.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { checkCode, pairingExpired } from '../model/identityServer.ts';

type Mode = 'code' | 'device';

/** Khôi phục bằng MÃ: nhập đúng thì nhận mã thay thế (KHÔNG được bỏ qua) và phải nhập lại 2 nhóm; mã chỉ mất hiệu lực khi mã mới được xác nhận (QĐ-6). */
function CodeRecover() {
  const { server, actions, startFlow, closeFlow } = useIdentity();
  const toast = useToast();
  const [value, setValue] = useState('');
  const { locked, failed, fail, reset } = useAttemptLock('recover');
  /** Mở luồng phát mã thay thế; hết hạn lần thử thì phải bắt đầu lại. */
  const start = (): void =>
    startFlow({
      kind: 'issue',
      issue: {
        purpose: 'recover',
        expiresAt: Date.now() + IDENTITY.ATTEMPT_TTL_MS,
        onExpired: () => {
          closeFlow();
          toast.show(C.recover.attemptExpired);
        },
        onCommit: (code) => {
          actions.joinHere('recovered');
          actions.commitCode(code);
        },
        onDone: () => {
          closeFlow();
          toast.show(C.recover.recovered);
          navigate(VIEW.TRIPS);
        },
      },
    });
  return (
    <>
      <Field code label={C.recover.codeLabel} value={value} onChange={setValue} disabled={locked} hint={C.recover.codeHelp} />
      {failed || locked ? <WarnBox>{locked ? C.recover.locked : C.recover.wrong}</WarnBox> : null}
      <Button
        block
        disabled={locked}
        onClick={() => {
          if (checkCode(server, value)) {
            reset();
            start();
          } else fail();
        }}
      >
        {C.recover.next}
      </Button>
    </>
  );
}

/** Khôi phục bằng THIẾT BỊ CŨ DUYỆT: máy này hiện mã ghép + số khớp; khi thiết bị cũ duyệt đúng số, máy này vào danh sách thiết bị tin cậy. */
function DeviceRecover() {
  const { server, actions } = useIdentity();
  const toast = useToast();
  const [limited, setLimited] = useState(false);
  const now = useNow(IDENTITY.POLL_MS);
  const p = server.pairing;
  const expired = p ? pairingExpired(p, now) : false;
  const approved = p?.status === 'approved' && !expired && Boolean(server.identity);
  const joined = useRef(false);
  useEffect(() => {
    if (!approved || joined.current) return; // một lần duy nhất (StrictMode chạy effect hai lần)
    joined.current = true;
    actions.joinHere('paired');
    toast.show(C.recover.recovered);
    navigate(VIEW.TRIPS);
  }, [approved, actions, toast]);
  if (!p || p.status === 'denied' || expired) {
    return (
      <>
        <p className="note">{C.recover.deviceText}</p>
        {p?.status === 'denied' ? <WarnBox>{C.recover.denied}</WarnBox> : null}
        {expired && p?.status !== 'denied' ? <WarnBox>{C.recover.expired}</WarnBox> : null}
        {limited ? <WarnBox>{C.recover.limit}</WarnBox> : null}
        <Button block onClick={() => setLimited(actions.requestPairing() === null)}>
          {C.recover.show}
        </Button>
      </>
    );
  }
  return (
    <>
      <div className="pairbox">
        <span className="note">{C.recover.pairLabel}</span>
        <b className="pcode big">{PairingCode.parse(p.code)?.format() ?? p.code}</b>
        <span className="note">{C.recover.numberLabel}</span>
        <b className="pcode big">{p.number}</b>
        <span className="note">{C.recover.pairHint}</span>
      </div>
      <div className="waitbox" role="status">
        <span className="spin" aria-hidden="true" />
        {C.recover.waiting}
      </div>
      {IS_DEV ? (
        <div className="protobox">
          <b>{C.demo.title}</b>
          <p className="note">{C.demo.note}</p>
          <Button onClick={() => actions.decidePairing('approved')}>{C.demo.approveFromOld}</Button>
          <Button kind="ghost" onClick={() => actions.decidePairing('denied')}>{C.demo.denyFromOld}</Button>
        </div>
      ) : null}
    </>
  );
}

/** Màn "Mở chuyến đi trên máy này" (S13) cho người đã dùng Wander ở thiết bị khác: bằng mã khôi phục hoặc thiết bị cũ duyệt. Máy đã có danh tính thì chỉ báo và dẫn tới Bảo mật. */
export function RecoverScreen() {
  const { identity } = useIdentity();
  const [mode, setMode] = useState<Mode>('code');
  if (identity) {
    return <EmptyState title={C.recover.already} text="" actions={<Button onClick={() => navigate(VIEW.SECURITY)}>{C.recover.alreadyAction}</Button>} />;
  }
  return (
    <>
      <div className="pagehead pad-x">
        <div>
          <IconButton icon="chevron-left" label={C.recover.back} onClick={() => navigate(VIEW.EXPLORE)} />
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
