import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

/** Kiểu nút: thêm biến thể = thêm một dòng ở bảng (mở rộng, không sửa chỗ khác). */
const KIND_CLASS = { primary: 'g-primary', secondary: 'secondary', ghost: 'ghost', danger: 'danger', sun: 'sun' } as const;
type ButtonKind = keyof typeof KIND_CLASS;

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'> {
  readonly ref?: Ref<HTMLButtonElement>;
  readonly kind?: ButtonKind;
  readonly icon?: IconName;
  /** Mũi tên cuối nhãn: dấu hiệu "đi tiếp" của hành động chính (cấp bậc bằng hình, không bằng mảng màu). */
  readonly arrow?: boolean;
  readonly block?: boolean;
  /** Lớp bổ sung của màn dùng nút (ví dụ kích thước riêng); kiểu gốc vẫn do `kind`/`block`. */
  readonly className?: string;
  readonly children: ReactNode;
}

/** Nút hành động chính/phụ của Wander (vùng chạm ≥ 44 px do CSS `.btn`). */
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
