import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

/** Kiểu nút: thêm biến thể = thêm một dòng ở bảng (mở rộng, không sửa chỗ khác). */
const KIND_CLASS = { primary: '', ghost: 'ghost', danger: 'danger', sun: 'sun' } as const;
type ButtonKind = keyof typeof KIND_CLASS;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> {
  readonly kind?: ButtonKind;
  readonly icon?: IconName;
  readonly block?: boolean;
  /** Lớp bổ sung của màn dùng nút (ví dụ kích thước riêng); kiểu gốc vẫn do `kind`/`block`. */
  readonly className?: string;
  readonly children: ReactNode;
}

/** Nút hành động chính/phụ của Wander (vùng chạm ≥ 44 px do CSS `.btn`). */
export function Button({ kind = 'primary', icon, block, className, children, ...rest }: ButtonProps) {
  const cls = ['btn', KIND_CLASS[kind], block ? 'block' : '', className].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}
