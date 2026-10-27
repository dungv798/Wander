import { useToast } from '../../../shared/ui/Toast.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { firstIssueSpec } from '../hooks/issueSpecs.ts';
import { useReportError } from '../hooks/useReportError.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { Flow } from '../model/identityFlow.types.ts';
import { PairConfirmSheet, RevokeSheet } from './DeviceSheets.tsx';
import { IntroSheet } from './IntroSheet.tsx';
import { IssueCodeSheet } from './IssueCodeSheet.tsx';
import { ReauthSheet } from './ReauthSheet.tsx';

/** Tờ giới thiệu lưu lần đầu (F2) và luồng hiện mã đi sau nó; "Để sau" tạo danh tính chưa có mã rồi đi tiếp việc đang chờ. */
function IntroFlow({ onSaved, replacing }: { readonly onSaved: () => unknown; readonly replacing: boolean }) {
  const { actions, startFlow, closeFlow } = useIdentity();
  const toast = useToast();
  const report = useReportError();
  /** Chỉ tạo danh tính (chưa có mã), đóng tờ, chạy việc đang chờ và nhắc tạo mã ở Bảo mật. */
  const saveLater = (): void => {
    actions.ensureIdentity().then(() => {
      closeFlow();
      // việc đi tiếp (tạo chuyến) có thể mất một nhịp: nhắc "chưa có mã" sau khi nó xong để không bị thông báo khác đè
      // chỉ nhắc khi việc đi tiếp thành công (false = đã báo lỗi; nhắc ngay sẽ đè mất thông báo lỗi)
      return Promise.resolve(onSaved()).then((ok) => {
        if (ok !== false) toast.show(C.intro.skipSaved);
      }).catch(() => undefined);
    }).catch(report);
  };
  return (
    <IntroSheet
      replacing={replacing}
      onCreate={() => startFlow({
        kind: 'issue',
        issue: firstIssueSpec(actions, {
          onDone: () => {
            closeFlow();
            onSaved();
          },
          onSkip: saveLater,
        }),
      })}
      onLater={saveLater}
      onClose={closeFlow}
    />
  );
}

/** Hiện đúng tờ của luồng danh tính đang mở (mỗi lần một luồng). */
export function IdentityFlowHost({ flow }: { readonly flow: Flow }) {
  const { closeFlow } = useIdentity();
  switch (flow.kind) {
    case 'intro':
      return <IntroFlow onSaved={flow.onSaved} replacing={flow.replacing === true} />;
    case 'issue':
      return <IssueCodeSheet issue={flow.issue} onClose={closeFlow} />;
    case 'reauth':
      return <ReauthSheet title={flow.title} why={flow.why} attempt={flow.attempt} onClose={closeFlow} />;
    case 'revoke':
      return <RevokeSheet deviceId={flow.deviceId} onClose={closeFlow} />;
    case 'pairConfirm':
      return <PairConfirmSheet preview={flow.preview} onClose={closeFlow} />;
  }
}
