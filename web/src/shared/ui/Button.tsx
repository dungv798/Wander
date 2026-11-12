import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

/** The button kinds: adding a variant = adding one row to the table (extend, do not edit elsewhere). */
const KIND_CLASS = { primary: 'g-primary', secondary: 'secondary', ghost: 'ghost', danger: 'danger', sun: 'sun' } as const;
type ButtonKind = keyof typeof KIND_CLASS;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly kind?: ButtonKind;
  readonly icon?: IconName;
  /** The arrow at the end of the label: the 'go on' sign of the main action (hierarchy by shape, not by a color patch). */
  readonly arrow?: boolean;
  readonly block?: boolean;
  /** An extra class from the screen that uses the button (for example its own size); the base style is still decided by `kind`/`block`. */
  readonly className?: string;
  readonly children: ReactNode;
}

/** Wander's primary/secondary action button (the touch area of at least 44 px comes from the CSS `.btn`). */
export function Button({ kind = 'primary', icon, arrow, block, className, children, ...rest }: ButtonProps) {
  const cls = ['btn', 'glass-control', KIND_CLASS[kind], block ? 'block' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {arrow ? <Icon name="chevron-left" className="flip btn-arrow" /> : null}
    </button>
  );
}
