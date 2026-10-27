import { describeError } from '../api/describeError.ts';
import { ERROR_ACTION_LABEL, ERROR_CODE_LABEL } from '../api/errorMessages.const.ts';
import type { ErrorAction } from '../api/errorMessages.const.ts';
import { fill } from '../const/copy.vi.ts';
import { Button } from './Button.tsx';

interface ErrorBoxProps {
  /** Lỗi cần hiện (thường là `ApiError`). */
  readonly error: unknown;
  /** Làm gì khi bấm nút của lối đi gợi ý (thử lại, mở Bảo mật…). Không có thì không hiện nút. */
  readonly onAction?: (action: ErrorAction) => void;
  /** Nút "Đóng" phụ (tùy chọn). */
  readonly onClose?: () => void;
}

/** Hộp lỗi theo mã (S20): `role=alert`, tiêu đề + lời tiếng Việt + mã nhỏ để hỏi hỗ trợ; không đếm lần thử, không lộ lỗi thô. */
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
