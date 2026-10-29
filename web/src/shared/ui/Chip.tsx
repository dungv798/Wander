import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

/** Kiểu nhãn: tint (nền nhạt theo loại), glass (kính tối trên ảnh), cat (màu loại đặc), sun (vàng), warn. */
export type ChipTone = 'tint' | 'glass' | 'cat' | 'sun' | 'warn' | 'on';

interface ChipProps {
  readonly tone?: ChipTone;
  readonly icon?: IconName;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Nhãn nhỏ (viên thuốc) cho loại, mùa, thời lượng… Chỉ để đọc, không phải nút. */
export function Chip({ tone, icon, className, children }: ChipProps) {
  const cls = ['chip', 'glass-control', tone, className].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {icon ? <Icon semantic name={icon} size="s" /> : null}
      {children}
    </span>
  );
}
