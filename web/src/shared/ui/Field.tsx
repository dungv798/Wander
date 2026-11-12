import { useId } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

interface BaseProps {
  readonly label: string;
  /** A hint under the box (for example '= 150,000 VND'); not an error. */
  readonly hint?: string;
  /** The error beside the right box; linked to the control and announced to screen readers. */
  readonly error?: string;
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
  /** A code input box (recovery/pairing): turns off auto suggestions, types uppercase, no spelling underline. */
  readonly code?: boolean;
  readonly disabled?: boolean;
  /** Read-only but still selectable/copyable (for example the invite link that was just created). */
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

/** The properties of a code input box: no autofill, auto capitalization, no spell check. */
const CODE_INPUT = { autoComplete: 'off', autoCapitalize: 'characters', spellCheck: false } as const;

/** An input box with a visible label (not only a placeholder), a hint and `aria-describedby`; covering text/date/time boxes, a text area and a select list. */
export function Field(props: InputProps | TextareaProps | SelectProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-h`;
  const describedBy = props.hint || props.error ? hintId : undefined;
  const on = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => props.onChange(e.target.value);
  let control: ReactNode;
  if (props.as === 'textarea') control = <textarea id={id} rows={props.rows} maxLength={props.maxLength} value={props.value} onChange={on} aria-labelledby={labelId} aria-describedby={describedBy} aria-invalid={Boolean(props.error) || undefined} />;
  else if (props.as === 'select') control = <select id={id} value={props.value} onChange={on} aria-labelledby={labelId} aria-describedby={describedBy} aria-invalid={Boolean(props.error) || undefined}>{props.children}</select>;
  else control = <input id={id} type={props.type ?? 'text'} inputMode={props.inputMode} placeholder={props.placeholder} maxLength={props.maxLength} value={props.value} onChange={on} aria-labelledby={labelId} aria-describedby={describedBy} aria-invalid={Boolean(props.error) || undefined} disabled={props.disabled} readOnly={props.readOnly} {...(props.code ? CODE_INPUT : {})} />;
  return (
    <label className="field" htmlFor={id} hidden={props.hidden}>
      <span id={labelId}>{props.label}</span>
      {control}
      {props.hint || props.error ? (
        <small id={hintId} className={props.error ? 'field-error' : 'hint'} role={props.error ? 'alert' : undefined}>
          {props.error || props.hint}
        </small>
      ) : null}
    </label>
  );
}
