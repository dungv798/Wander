import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface EmptyStateProps {
  readonly title: string;
  readonly text: string;
  readonly icon?: IconName;
  /** `alert` for an error (read at once), `status` for an ordinary empty state. */
  readonly role?: 'alert' | 'status';
  readonly actions?: ReactNode;
  readonly className?: string;
  /** A screen that has only this box (no other page title) uses `h1`; `h2` by default. */
  readonly pageTitle?: boolean;
}

/** A shared empty/error state: an icon, a title, an explanation and an action button. */
export function EmptyState({ title, text, icon, role, actions, className, pageTitle = false }: EmptyStateProps) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <div className={['empty', 'pad-x', className].filter(Boolean).join(' ')} role={role}>
      {icon ? (
        <span className="ib">
          <Icon semantic name={icon} size="l" />
        </span>
      ) : null}
      <Heading className="h2">{title}</Heading>
      <p>{text}</p>
      {actions}
    </div>
  );
}
