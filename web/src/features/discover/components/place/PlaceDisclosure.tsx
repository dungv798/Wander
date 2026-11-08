import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import type { IconName } from '../../../../shared/ui/icons/iconPaths.const.ts';
import { DISCOVER_COPY } from '../../model/discover.copy.ts';

interface PlaceDisclosureProps {
  readonly title: string;
  readonly icon: IconName;
  readonly children: ReactNode;
  readonly className?: string;
  readonly defaultOpen?: boolean;
}

/** Giữ nội dung trong DOM để đóng/mở theo chiều cao thật, trả focus và trạng thái đúng cho bàn phím. */
export function PlaceDisclosure({ title, icon, children, className = '', defaultOpen = false }: PlaceDisclosureProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return <section className={`place-info-card place-disclosure ${className}`} data-open={open}>
    <h4>
      <button type="button" className="place-disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>
        <Icon semantic name={icon} />
        <span className="place-disclosure-title">{title}</span>
        <span className="place-disclosure-hint">{open ? DISCOVER_COPY.seeLess : DISCOVER_COPY.seeMore}</span>
        <Icon name="chevron-down" className="place-chevron" size="s" />
      </button>
    </h4>
    <div className="place-disclosure-grid" id={id} inert={!open} aria-hidden={!open}>
      <div className="place-disclosure-clip"><div className="place-disclosure-body">{children}</div></div>
    </div>
  </section>;
}

/** Một kiểu link-button kính trung tính cho mọi nút xem thêm trong chi tiết. */
export function PlaceMoreButton({ open, controls, onClick }: { readonly open: boolean; readonly controls: string; readonly onClick: () => void }) {
  return <button className="place-more" type="button" aria-expanded={open} aria-controls={controls} onClick={onClick}>
    {open ? DISCOVER_COPY.seeLess : DISCOVER_COPY.seeMore}
    <Icon name="chevron-down" className="place-chevron" size="s" />
  </button>;
}
