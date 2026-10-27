import { useToast } from '../../../shared/ui/Toast.tsx';
import { useIdentity } from '../hooks/identityContext.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { Flow, IssueSpec } from '../model/identityFlow.types.ts';
import { PairConfirmSheet, RevokeSheet } from './DeviceSheets.tsx';
import { IntroSheet } from './IntroSheet.tsx';
import { IssueCodeSheet } from './IssueCodeSheet.tsx';
import { ReauthSheet } from './ReauthSheet.tsx';

/** Luồng lần đầu (F2): tạo danh tính + chốt mã khi nhập lại đúng, hoặc "Để sau" (danh tính chưa có mã) rồi đi tiếp việc đang chờ. */
function useFirstIssue(onSaved: () => void): IssueSpec {
  const { actions, closeFlow } = useIdentity();
  const toast = useToast();
  return {
    purpose: 'first',
    onCommit: (code) => {
      actions.createHere();
      actions.commitCode(code);
    },
    onDone: () => {
      closeFlow();
      onSaved();
    },
    onSkip: () => {
      actions.createHere();
      closeFlow();
      onSaved();
      toast.show(C.intro.skipSaved);
    },
  };
}

/** Tờ giới thiệu lưu lần đầu và luồng hiện mã đi sau nó. */
function IntroFlow({ onSaved, replacing }: { readonly onSaved: () => void; readonly replacing: boolean }) {
  const { startFlow, closeFlow, actions } = useIdentity();
  const toast = useToast();
  const first = useFirstIssue(onSaved);
  return (
    <IntroSheet
      replacing={replacing}
      onCreate={() => startFlow({ kind: 'issue', issue: first })}
      onLater={() => {
        actions.createHere();
        closeFlow();
        onSaved();
        toast.show(C.intro.skipSaved);
      }}
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
      return <ReauthSheet title={flow.title} why={flow.why} onOk={flow.onOk} onClose={closeFlow} />;
    case 'revoke':
      return <RevokeSheet deviceId={flow.deviceId} onClose={closeFlow} />;
    case 'pairConfirm':
      return <PairConfirmSheet pairing={flow.pairing} onClose={closeFlow} />;
  }
}
