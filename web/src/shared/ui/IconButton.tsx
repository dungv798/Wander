import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type' | 'aria-label'> {
  readonly icon: IconName;
  /** The label for screen readers: REQUIRED because the button has only an icon. */
  readonly label: string;
  readonly className?: string;
  /** Rotates the icon 180 degrees (reusing the left arrow as the right arrow). */
  readonly flip?: boolean;
}

/** A round button with only an icon (44x44 px), always with `aria-label`. */
export function IconButton({ icon, label, className, flip, ...rest }: IconButtonProps) {
  return (
    <button type="button" className={['iconbtn', 'g-fab', 'glass-control', className].filter(Boolean).join(' ')} aria-label={label} {...rest}>
      <Icon name={icon} className={flip ? 'flip' : undefined} />
    </button>
  );
}
