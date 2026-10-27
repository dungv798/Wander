import { useState } from 'react';
import { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { copyText, downloadCode, printCode } from '../hooks/codeExport.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { IssueSpec } from '../model/identityFlow.types.ts';
import { CheckStep, DoneStep, ShowStep } from './IssueSteps.tsx';

type Step = 'show' | 'check' | 'done';

/** Không làm gì: Esc và chạm nền KHÔNG đóng tờ hiện mã (S10), chỉ nút Hủy/Xong đóng. */
const LOCKED = (): void => undefined;

/**
 * Tờ phát mã khôi phục mới (S10): hiện mã một lần → nhập lại 2 trong 6 nhóm → mã có hiệu lực ngay lúc đó (QĐ-6) → xem lại lần cuối.
 * Mã sinh một lần khi mở tờ (bản giả; mã thật do máy chủ sinh và băm). Hủy giữa chừng không đổi gì.
 */
export function IssueCodeSheet({ issue, onClose }: { readonly issue: IssueSpec; readonly onClose: () => void }) {
  const toast = useToast();
  const [code] = useState(() => RecoveryCode.generate());
  const [step, setStep] = useState<Step>('show');
  const [indexes, setIndexes] = useState<readonly number[]>([]);

  /** Sao chép mã và báo kết quả; thất bại thì hướng dẫn chép tay. */
  const copy = (): void => void copyText(code.format()).then((ok) => toast.show(ok ? C.code.copied : C.code.copyFail));
  /** Xác nhận đúng: nếu lần thử khôi phục đã hết hạn thì phải bắt đầu lại, ngược lại chốt mã. */
  const confirm = (): void => {
    if (issue.expiresAt !== undefined && Date.now() > issue.expiresAt) {
      issue.onExpired?.();
      return;
    }
    issue.onCommit(code);
    setStep('done');
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
      {step === 'check' ? <CheckStep code={code} indexes={indexes} onConfirm={confirm} onBack={() => setStep('show')} /> : null}
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
