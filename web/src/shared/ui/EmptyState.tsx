import type { ReactNode } from 'react';
import { Icon } from './Icon.tsx';
import type { IconName } from './icons/iconPaths.const.ts';

interface EmptyStateProps {
  readonly title: string;
  readonly text: string;
  readonly icon?: IconName;
  /** `alert` cho lỗi (đọc ngay), `status` cho trạng thái rỗng thông thường. */
  readonly role?: 'alert' | 'status';
  readonly actions?: ReactNode;
  readonly className?: string;
  /** Màn chỉ có hộp này (không có tiêu đề trang khác) thì dùng `h1`; mặc định `h2`. */
  readonly pageTitle?: boolean;
}

/** Trạng thái rỗng/lỗi dùng chung: biểu tượng, tiêu đề, lời giải thích và nút hành động. */
export function EmptyState({ title, text, icon, role, actions, className, pageTitle = false }: EmptyStateProps) {
  const Heading = pageTitle ? 'h1' : 'h2';
  return (
    <div className={['empty', 'pad-x', className].filter(Boolean).join(' ')} role={role}>
      {icon ? (
        <span className="ib">
          <Icon name={icon} size="l" />
        </span>
      ) : null}
      <Heading className="h2">{title}</Heading>
      <p>{text}</p>
      {actions}
    </div>
  );
}
