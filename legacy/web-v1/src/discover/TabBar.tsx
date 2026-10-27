import { Icon } from './Icon';

export type Tab = 'explore' | 'picked' | 'trips';

/** Thanh điều hướng nổi: Khám phá, Đã chọn, Chuyến đi. */
export function TabBar({ current, pickedCount }: { current: Tab; pickedCount: number }) {
  const item = (tab: Tab, href: string, icon: string, label: string, badge?: number) => (
    <a className="dk-tab" href={href} aria-current={current === tab ? 'page' : undefined}>
      <Icon name={icon} />
      <span>{label}</span>
      {badge ? <span className="dot">{badge}</span> : null}
    </a>
  );
  return (
    <nav className="dk-tabbar" aria-label="Điều hướng chính">
      {item('explore', '#/', 'compass', 'Khám phá')}
      {item('picked', '#/picked', 'bookmarks', 'Đã chọn', pickedCount)}
      {item('trips', '#/trips', 'calendar-event', 'Chuyến đi')}
    </nav>
  );
}
