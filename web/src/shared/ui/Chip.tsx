import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

/** The label kinds: tint (a light background by kind), glass (a dark glass on a photo), cat (a solid kind color), sun (yellow), warn. */
export type ChipTone = 'tint' | 'glass' | 'cat' | 'sun' | 'warn' | 'on';

interface ChipProps {
  readonly tone?: ChipTone;
  readonly icon?: IconName;
  readonly className?: string;
  readonly children: ReactNode;
}

/** A small label (a pill) for kind, season, duration... Only for reading, not a button. */
export function Chip({ tone, icon, className, children }: ChipProps) {
  const cls = ['chip', tone, className].filter(Boolean).join(' ');
  return (
    <span className={cls}>
      {icon ? <Icon semantic name={icon} size="s" /> : null}
      {children}
    </span>
  );
}
