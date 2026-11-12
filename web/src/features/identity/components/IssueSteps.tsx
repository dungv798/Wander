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
  /** First-time flow only: 'Later'. */
  readonly onSkip?: () => void;
  readonly onCancel: () => void;
}

/** Step 1: shows the code ONCE, warns how to keep it, copy; 'Later' exists only in the first-time flow (recovery does NOT have this button, QĐ-6). */
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
  /** The indexes (0..5) of the two groups the system picks at random. */
  readonly indexes: readonly number[];
  readonly onConfirm: () => void;
  readonly onBack: () => void;
  /** Waiting for the server to commit the code: locks the button so it is not pressed twice. */
  readonly busy?: boolean;
}

/** Step 2: type again 2 of the 6 groups chosen by the system (DR-018 B3); a wrong one reports 'does not match yet', without revealing which group is wrong. */
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

/** Step 3: the code is in effect; allows a last review, copy, download, print. */
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
