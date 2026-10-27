import { useState } from 'react';
import { useFocusOnMount } from '../../../shared/hooks/useFocusOnMount.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import type { RecoveryCode } from '../../../shared/domain/RecoveryCode.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { IssuePurpose } from '../model/identityFlow.types.ts';
import { CodeBox } from './CodeBox.tsx';

const WHY: Record<IssuePurpose, string> = { first: C.code.whyFirst, regen: C.code.whyReauth, recover: C.code.whyRecover };

interface ShowProps {
  readonly code: RecoveryCode;
  readonly purpose: IssuePurpose;
  readonly onCopy: () => void;
  readonly onNext: () => void;
  /** Chỉ luồng lần đầu: "Để sau". */
  readonly onSkip?: () => void;
  readonly onCancel: () => void;
}

/** Bước 1: hiện mã MỘT lần, cảnh báo cách giữ, sao chép; "Để sau" chỉ có ở luồng lần đầu (khôi phục KHÔNG có nút này, QĐ-6). */
export function ShowStep({ code, purpose, onCopy, onNext, onSkip, onCancel }: ShowProps) {
  const first = purpose === 'first';
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <div className="pp">
      <div>
        <h2 ref={heading} tabIndex={-1}>{first ? C.code.titleFirst : C.code.titleNew}</h2>
        <p className="note spaced">{WHY[purpose]}</p>
      </div>
      <CodeBox code={code} label={C.code.groupAria} />
      <WarnBox>{C.code.warn}</WarnBox>
      <div className="stack">
        <Button kind="ghost" block icon="share-2" onClick={onCopy}>
          {C.code.copy}
        </Button>
        <Button block onClick={onNext}>
          {C.code.next}
        </Button>
        {onSkip ? (
          <Button kind="ghost" block onClick={onSkip}>
            {C.code.later}
          </Button>
        ) : null}
        <Button kind="ghost" block onClick={onCancel}>
          {first && onSkip ? C.code.cancelFirst : C.code.cancel}
        </Button>
      </div>
    </div>
  );
}

interface CheckProps {
  readonly code: RecoveryCode;
  /** Chỉ số (0..5) hai nhóm hệ thống chọn ngẫu nhiên. */
  readonly indexes: readonly number[];
  readonly onConfirm: () => void;
  readonly onBack: () => void;
  /** Đang chờ máy chủ chốt mã: khóa nút để không bấm hai lần. */
  readonly busy?: boolean;
}

/** Bước 2: nhập lại 2 trong 6 nhóm do hệ thống chọn (DR-018 B3); sai thì báo "chưa khớp", không lộ nhóm nào sai. */
export function CheckStep({ code, indexes, onConfirm, onBack, busy = false }: CheckProps) {
  const [answers, setAnswers] = useState<string[]>(() => indexes.map(() => ''));
  const [wrong, setWrong] = useState(false);
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <div className="pp">
      <div>
        <h2 ref={heading} tabIndex={-1}>{C.challenge.title}</h2>
        <p className="note spaced">{C.challenge.text}</p>
      </div>
      <div className="two">
        {indexes.map((g, i) => (
          <Field
            key={g}
            code
            label={fill(C.challenge.groupLabel, { n: g + 1 })}
            value={answers[i] ?? ''}
            maxLength={code.groups[g]?.length}
            onChange={(v) => setAnswers((cur) => cur.map((a, k) => (k === i ? v : a)))}
          />
        ))}
      </div>
      {wrong ? <WarnBox>{C.challenge.mismatch}</WarnBox> : null}
      <div className="stack">
        <Button
          block
          disabled={busy}
          onClick={() => {
            if (code.matchesChallenge(indexes, answers)) onConfirm();
            else setWrong(true);
          }}
        >
          {C.challenge.confirm}
        </Button>
        <Button kind="ghost" block onClick={onBack}>
          {C.challenge.back}
        </Button>
      </div>
    </div>
  );
}

interface DoneProps {
  readonly code: RecoveryCode;
  readonly onCopy: () => void;
  readonly onDownload: () => void;
  readonly onPrint: () => void;
  readonly onFinish: () => void;
}

/** Bước 3: mã đã có hiệu lực; cho xem lại một lần cuối, sao chép, tải về, in. */
export function DoneStep({ code, onCopy, onDownload, onPrint, onFinish }: DoneProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <div className="pp">
      <div>
        <span className="obx-ok" aria-hidden="true">
          <Icon name="check" size="l" />
        </span>
        <h2 ref={heading} tabIndex={-1}>{C.done.title}</h2>
        <p className="note spaced">{C.done.text}</p>
      </div>
      <CodeBox code={code} label={C.done.groupAria} />
      <div className="stack">
        <div className="two">
          <Button kind="ghost" icon="share-2" onClick={onCopy}>
            {C.done.copy}
          </Button>
          <Button kind="ghost" onClick={onDownload}>
            {C.done.download}
          </Button>
        </div>
        <Button kind="ghost" block onClick={onPrint}>
          {C.done.print}
        </Button>
        <Button block onClick={onFinish}>
          {C.done.finish}
        </Button>
      </div>
    </div>
  );
}
