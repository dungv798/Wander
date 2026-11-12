import { describeError } from '../api/describeError.ts';
import { ERROR_ACTION_LABEL, ERROR_CODE_LABEL } from '../api/errorMessages.const.ts';
import type { ErrorAction } from '../api/errorMessages.const.ts';
import { fill } from '../const/copy.vi.ts';
import { Button } from './Button.tsx';

interface ErrorBoxProps {
  /** The error to show (usually an `ApiError`). */
  readonly error: unknown;
  /** What to do when the suggested way-out button is pressed (retry, open Security...). If there is none the button is not shown. */
  readonly onAction?: (action: ErrorAction) => void;
  /** A secondary 'Close' button (optional). */
  readonly onClose?: () => void;
}

/** The error box by code (S20): `role=alert`, a title + Vietnamese text + a small code to ask support; it counts no attempts and exposes no raw error. */
export function ErrorBox({ error, onAction, onClose }: ErrorBoxProps) {
  const d = describeError(error);
  return (
    <div className="errbox" role="alert">
      <h2 className="h3">{d.title}</h2>
      <p>{d.text}</p>
      <p className="note errcode">{fill(ERROR_CODE_LABEL, { code: d.code })}</p>
      {onAction && d.action !== 'close' ? (
        <Button block onClick={() => onAction(d.action)}>
          {ERROR_ACTION_LABEL[d.action]}
        </Button>
      ) : null}
      {onClose ? (
        <Button kind="ghost" block onClick={onClose}>
          {ERROR_ACTION_LABEL.close}
        </Button>
      ) : null}
    </div>
  );
}
