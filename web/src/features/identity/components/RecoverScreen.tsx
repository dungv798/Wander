import { useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { PairingCode } from '../../../shared/domain/PairingCode.ts';
import { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useAttemptLock, useIdentity } from '../hooks/identityContext.ts';
import { RetryState } from './SecurityScreen.tsx';
import { recoverySession } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY } from '../model/identity.const.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { PairingRequest } from '../model/identity.types.ts';

type Mode = 'code' | 'device';

/** Mã lỗi backend khi mã khôi phục sai, đã dùng hoặc hết hiệu lực (một mã chung, MĐ-8). */
const WRONG_CODE_ERRORS: readonly string[] = ['INVALID_CODE', 'CODE_ALREADY_USED', 'INVALID_ATTEMPT'];

/**
 * Khôi phục bằng MÃ: máy chủ kiểm mã, nếu đúng thì sinh mã thay thế (KHÔNG được bỏ qua) và phải nhập lại 2 nhóm; mã cũ chỉ mất hiệu lực
 * khi mã mới được xác nhận (QĐ-6). Hết hạn lần thử (15 phút) thì bắt đầu lại.
 */
function CodeRecover() {
  const { actions, startFlow, closeFlow } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const { locked, failed, fail, reset } = useAttemptLock('recover');
  /** Gửi mã lên máy chủ; đúng thì mở luồng phát mã thay thế, sai thì đếm lần thử (bền, khóa tạm khi sai đủ 5 lần). */
  const submit = (): void => {
    if (!RecoveryCode.parse(value)) {
      fail();
      return;
    }
    setBusy(true);
    actions.startRecovery(value).then((attempt) => {
      reset();
      setValue(''); // mã chưa bị tiêu thụ: không để nó nằm lại trong ô nhập
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

/** Kết quả hỏi trạng thái yêu cầu ghép đang chờ ở máy này. */
type Outcome = 'denied' | 'expired' | null;

/**
 * Hỏi trạng thái yêu cầu ghép mỗi giây tới khi được duyệt (máy này nhận phiên và về danh sách chuyến đi), bị từ chối hoặc hết hạn
 * (xóa yêu cầu và báo kết quả). Chỉ nhận phiên MỘT lần dù React chạy effect hai lần.
 */
function usePairingPoll(request: PairingRequest | null, setRequest: (r: PairingRequest | null) => void, setOutcome: (o: Outcome) => void): void {
  const { actions } = useIdentity();
  const toast = useToast();
  const [joined] = useState(() => ({ done: false }));
  useEffect(() => {
    if (!request) return undefined;
    let stopped = false;
    const timer = window.setInterval(() => {
      if (stopped) return;
      if (Date.now() > request.expiresAt) {
        stopped = true;
        setRequest(null);
        setOutcome('expired');
        return;
      }
      actions.pairingStatus(request).then((status) => {
        if (stopped) return;
        if (status === 'approved' && !joined.done) {
          stopped = true;
          joined.done = true; // một lần duy nhất (StrictMode chạy effect hai lần)
          void actions.joinHere(request).then(() => {
            toast.show(C.recover.recovered);
            navigate(VIEW.TRIPS);
          });
        } else if (status === 'denied' || status === 'expired') {
          stopped = true;
          setRequest(null);
          setOutcome(status);
        }
      }).catch(() => undefined);
    }, IDENTITY.POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [request, actions, toast, joined, setRequest, setOutcome]);
}

/**
 * Khôi phục bằng THIẾT BỊ CŨ DUYỆT (DR-018 E1): máy này hiện mã ghép + số khớp do máy chủ cấp và hỏi lại mỗi giây; khi thiết bị cũ chọn
 * đúng số, máy này trở thành thiết bị tin cậy. Bí mật phiên do máy này tự sinh, chỉ có hiệu lực sau khi được duyệt.
 */
function DeviceRecover() {
  const { actions } = useIdentity();
  const report = useReportError();
  const [request, setRequest] = useState<PairingRequest | null>(null);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [limited, setLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Xin mã ghép mới; null nghĩa là quá hạn mức yêu cầu (3 lần mỗi 10 phút). */
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

/** Màn "Mở chuyến đi trên máy này" (S13) cho người đã dùng Wander ở thiết bị khác: bằng mã khôi phục hoặc thiết bị cũ duyệt. Máy đã có danh tính thì chỉ chỉ sang Bảo mật. */
export function RecoverScreen() {
  const { identity, status } = useIdentity();
  const [mode, setMode] = useState<Mode>('code');
  // đang nạp hoặc không nạp được: máy có thể vẫn có phiên dùng được, nên chưa cho khôi phục (sẽ đè lên phiên đó)
  if (status === 'loading' || status === 'error') return <RetryState />;
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
