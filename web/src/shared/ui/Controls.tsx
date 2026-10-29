import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface CheckRowProps {
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
  readonly children: ReactNode;
  readonly hidden?: boolean;
}

/** Ô tích có nhãn bên phải (vùng bấm là cả hàng). */
export function CheckRow({ checked, onChange, children, hidden }: CheckRowProps) {
  return (
    <label className="checkrow" hidden={hidden}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

interface ChipToggleProps {
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly icon?: IconName;
  readonly className?: string;
  readonly children: ReactNode;
}

/** Nút bật/tắt dạng viên thuốc (`aria-pressed`), dùng cho bộ lọc, sở thích, kiểu chuyến. */
export function ChipToggle({ pressed, onClick, icon, className, children }: ChipToggleProps) {
  return (
    <button className={['fchip', 'g-chip', 'glass-control', className].filter(Boolean).join(' ')} type="button" aria-pressed={pressed} onClick={onClick}>
      {icon ? <Icon semantic name={icon} size="s" /> : null}
      {children}
    </button>
  );
}

/** Khung cảnh báo trong biểu mẫu; `alert` cho lỗi (đọc ngay), mặc định `status`. */
export function WarnBox({ children, role = 'alert' }: { readonly children: ReactNode; readonly role?: 'alert' | 'status' }) {
  return (
    <div className="warnbox" role={role}>
      {children}
    </div>
  );
}

interface ProgressProps {
  readonly label: string;
  readonly value: number;
  readonly max: number;
  readonly over?: boolean;
}

const PERCENT = 100;

/** Thanh tiến độ có `role=progressbar` (số đã xếp/tổng, ngân sách đã dùng). */
export function Progress({ label, value, max, over }: ProgressProps) {
  const pct = max ? Math.min(PERCENT, Math.round((value / max) * PERCENT)) : 0;
  return (
    <div className={over ? 'prog over' : 'prog'} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuenow={value} aria-valuemax={max}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
