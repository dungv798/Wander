import { useId } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

interface BaseProps {
  readonly label: string;
  /** Gợi ý dưới ô (ví dụ "= 150.000 ₫"); không phải lỗi. */
  readonly hint?: string;
  readonly hidden?: boolean;
}

interface InputProps extends BaseProps {
  readonly as?: 'input';
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly type?: 'text' | 'date' | 'time';
  readonly inputMode?: 'numeric' | 'text';
  readonly placeholder?: string;
  readonly maxLength?: number;
  /** Ô nhập mã (khôi phục/ghép): tắt gợi ý tự động, gõ chữ hoa, không gạch chân chính tả. */
  readonly code?: boolean;
  readonly disabled?: boolean;
  /** Chỉ đọc nhưng vẫn chọn/chép được (ví dụ liên kết mời vừa tạo). */
  readonly readOnly?: boolean;
}

interface TextareaProps extends BaseProps {
  readonly as: 'textarea';
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly rows?: number;
  readonly maxLength?: number;
}

interface SelectProps extends BaseProps {
  readonly as: 'select';
  readonly value: string;
  readonly onChange: (v: string) => void;
  readonly children: ReactNode;
}

/** Thuộc tính của ô nhập mã: không tự điền, tự viết hoa, không kiểm chính tả. */
const CODE_INPUT = { autoComplete: 'off', autoCapitalize: 'characters', spellCheck: false } as const;

/** Ô nhập có nhãn hiện sẵn (không chỉ placeholder), gợi ý và `aria-describedby`; gồm ô chữ/ngày/giờ, vùng chữ và danh sách chọn. */
export function Field(props: InputProps | TextareaProps | SelectProps) {
  const id = useId();
  const hintId = `${id}-h`;
  const describedBy = props.hint ? hintId : undefined;
  const on = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => props.onChange(e.target.value);
  let control: ReactNode;
  if (props.as === 'textarea') control = <textarea id={id} rows={props.rows} maxLength={props.maxLength} value={props.value} onChange={on} aria-describedby={describedBy} />;
  else if (props.as === 'select') control = <select id={id} value={props.value} onChange={on} aria-describedby={describedBy}>{props.children}</select>;
  else control = <input id={id} type={props.type ?? 'text'} inputMode={props.inputMode} placeholder={props.placeholder} maxLength={props.maxLength} value={props.value} onChange={on} aria-describedby={describedBy} disabled={props.disabled} readOnly={props.readOnly} {...(props.code ? CODE_INPUT : {})} />;
  return (
    <label className="field" htmlFor={id} hidden={props.hidden}>
      {props.label}
      {control}
      {props.hint ? (
        <small id={hintId} className="hint">
          {props.hint}
        </small>
      ) : null}
    </label>
  );
}
