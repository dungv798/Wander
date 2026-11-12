import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface CheckRowProps {
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
  readonly children: ReactNode;
  readonly hidden?: boolean;
}

/** A tick box with the label on the right (the tap area is the whole row). */
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

/** A pill-shaped toggle button (`aria-pressed`), used for filters, interests, trip kinds. */
export function ChipToggle({ pressed, onClick, icon, className, children }: ChipToggleProps) {
  return (
    <button className={['fchip', 'g-chip', 'glass-control', className].filter(Boolean).join(' ')} type="button" aria-pressed={pressed} onClick={onClick}>
      <span className="selection-mark" aria-hidden="true"><Icon name="check" size="s" /></span>
      {icon ? <Icon semantic name={icon} size="s" /> : null}
      {children}
    </button>
  );
}

/** A warning frame in a form; `alert` for an error (read at once), `status` by default. */
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

/** A progress bar with `role=progressbar` (the number scheduled/total, the budget used). */
export function Progress({ label, value, max, over }: ProgressProps) {
  const pct = max ? Math.min(PERCENT, Math.round((value / max) * PERCENT)) : 0;
  return (
    <div className={over ? 'prog over' : 'prog'} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuenow={value} aria-valuemax={max}>
      <i style={{ width: `${pct}%` }} />
    </div>
  );
}
