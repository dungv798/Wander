import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { copyText, downloadCode, printCode } from '../hooks/codeExport.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { IssueSession, IssueSpec } from '../model/identityFlow.types.ts';
import { CheckStep, DoneStep, ShowStep } from './IssueSteps.tsx';

type Step = 'show' | 'check' | 'done';

/** Không làm gì: Esc và chạm nền KHÔNG đóng tờ hiện mã (S10), chỉ nút Hủy/Xong đóng. */
const LOCKED = (): void => undefined;
/** Mã lỗi backend khi lần thử mã mới đã hết hạn (15 phút) hoặc đã bị thay bằng lần khác. */
const EXPIRED_ERRORS: readonly string[] = ['ATTEMPT_EXPIRED', 'NO_PENDING_REPLACEMENT'];

/** Tờ chờ lúc xin mã từ máy chủ: không đóng bằng Esc hay chạm nền, chỉ có nút Hủy. */
function LoadingSheet({ onCancel }: { readonly onCancel: () => void }) {
  return (
    <Sheet label={C.code.titleNew} onClose={LOCKED}>
      <div className="pp">
        <div className="waitbox" role="status">
          <span className="spin" aria-hidden="true" />
          {C.code.loading}
        </div>
        <Button kind="ghost" block onClick={onCancel}>
          {C.code.cancel}
        </Button>
      </div>
    </Sheet>
  );
}

/**
 * Tờ phát mã khôi phục mới (S10): lấy mã do MÁY CHỦ sinh → hiện mã một lần → nhập lại 2 trong 6 nhóm → mã có hiệu lực ngay lúc đó
 * (QĐ-6) → xem lại lần cuối. Hủy giữa chừng không đổi gì ở mã hiện hành. Việc xin mã chạy đúng một lần dù React chạy effect hai lần.
 */
export function IssueCodeSheet({ issue, onClose }: { readonly issue: IssueSpec; readonly onClose: () => void }) {
  const toast = useToast();
  const report = useReportError();
  const [session, setSession] = useState<IssueSession | null>(null);
  const [step, setStep] = useState<Step>('show');
  const [indexes, setIndexes] = useState<readonly number[]>([]);
  const [busy, setBusy] = useState(false);
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return; // StrictMode chạy effect hai lần: chỉ xin mã một lần
    opened.current = true;
    issue.open().then(setSession).catch((e: unknown) => {
      (issue.onOpenFailed ?? report)(e);
      onClose();
    });
  }, [issue, onClose, report]);

  if (!session) return <LoadingSheet onCancel={onClose} />;
  const code = session.code;

  /** Sao chép mã và báo kết quả; thất bại thì hướng dẫn chép tay. */
  const copy = (): void => void copyText(code.format()).then((ok) => toast.show(ok ? C.code.copied : C.code.copyFail));
  /** Xác nhận đúng: quá hạn lần thử thì bắt đầu lại, ngược lại chốt mã ở máy chủ rồi sang bước xem lại. */
  const confirm = (): void => {
    setBusy(true);
    session.commit().then(() => setStep('done')).catch((e: unknown) => {
      if (e instanceof ApiError && EXPIRED_ERRORS.includes(e.code)) {
        // lần thử đã hết hạn hoặc bị thay: không còn gì để xác nhận, người dùng phải bắt đầu lại
        (issue.onExpired ?? ((): void => report(e)))();
        onClose();
      } else report(e);
    }).finally(() => setBusy(false));
  };

  return (
    <Sheet label={C.code.titleNew} onClose={LOCKED}>
      {step === 'show' ? (
        <ShowStep
          code={code}
          purpose={issue.purpose}
          onCopy={copy}
          onNext={() => {
            setIndexes(code.pickChallenge());
            setStep('check');
          }}
          onSkip={issue.onSkip}
          onCancel={onClose}
        />
      ) : null}
      {step === 'check' ? <CheckStep code={code} indexes={indexes} busy={busy} onConfirm={confirm} onBack={() => setStep('show')} /> : null}
      {step === 'done' ? (
        <DoneStep
          code={code}
          onCopy={copy}
          onDownload={() => toast.show(downloadCode(code) ? C.code.downloaded : C.code.downloadFail)}
          onPrint={() => {
            if (!printCode(code)) toast.show(C.code.printFail);
          }}
          onFinish={issue.onDone}
        />
      ) : null}
    </Sheet>
  );
}
