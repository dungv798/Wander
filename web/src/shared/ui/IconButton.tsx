import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type' | 'aria-label'> {
  readonly icon: IconName;
  /** Nhãn cho trình đọc màn hình: BẮT BUỘC vì nút chỉ có biểu tượng. */
  readonly label: string;
  readonly className?: string;
}

/** Nút tròn chỉ có biểu tượng (44×44 px), luôn có `aria-label`. */
export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  return (
    <button type="button" className={['iconbtn', 'g-fab', className].filter(Boolean).join(' ')} aria-label={label} {...rest}>
      <Icon name={icon} />
    </button>
  );
}
