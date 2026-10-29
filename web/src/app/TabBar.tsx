import { COPY } from '../shared/const/copy.vi.ts';
import { VIEW } from '../shared/const/routes.const.ts';
import type { ViewName } from '../shared/const/routes.const.ts';
import { navigate } from '../shared/router/hashRoute.ts';
import { Icon } from '../shared/ui/Icon.tsx';
import type { IconName } from '../shared/ui/icons/iconPaths.const.ts';

interface TabSpec {
  readonly view: ViewName;
  readonly icon: IconName;
  readonly label: string;
}

const TABS: readonly TabSpec[] = [
  { view: VIEW.EXPLORE, icon: 'compass', label: COPY.nav.explore },
  { view: VIEW.PICKED, icon: 'bookmarks', label: COPY.nav.picked },
  { view: VIEW.TRIPS, icon: 'calendar-event', label: COPY.nav.trips },
];

interface TabBarProps {
  readonly current: ViewName;
  /** Màn rộng: thêm logo ở đầu thanh bên. */
  readonly wide: boolean;
  /** Số nơi đã chọn (hiện chấm số ở tab "Đã chọn"); 0 = không hiện. */
  readonly pickedCount: number;
}

/** Logo Wander (máy bay giấy) ở đầu thanh bên màn rộng; bấm về Khám phá. */
function Brand() {
  return (
    <button className="brand" type="button" aria-label={COPY.brand.ariaHome} onClick={() => navigate(VIEW.EXPLORE)}>
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M21.5 2.5L2.5 10l7 2.6L12 20.5z" />
      </svg>
      <span>{COPY.brand.name}</span>
    </button>
  );
}

/** Thanh điều hướng chính: thanh tab nổi ở điện thoại, thanh bên ở màn rộng. */
export function TabBar({ current, wide, pickedCount }: TabBarProps) {
  return (
    <nav id="tabbar" className="g-tab" aria-label={COPY.nav.label}>
      {wide ? <Brand /> : null}
      {TABS.map((t) => (
        <button key={t.view} className="tab" type="button" aria-current={current === t.view ? 'page' : undefined} onClick={() => navigate(t.view)}>
          <Icon semantic name={t.icon} />
          <span>{t.label}</span>
          {t.view === VIEW.PICKED && pickedCount > 0 ? <span className="dot">{pickedCount}</span> : null}
        </button>
      ))}
    </nav>
  );
}
