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
  /** Wide screen: adds the logo at the top of the side bar. */
  readonly wide: boolean;
  /** The number of selected places (shows a number badge on the 'Selected' tab); 0 = not shown. */
  readonly pickedCount: number;
  readonly onCreate: () => void;
}

/** The Wander logo (a paper plane) at the top of the wide-screen side bar; tapping it returns to Discover. */
function Brand() {
  return (
    <button className="brand" type="button" aria-label={COPY.brand.ariaHome} onClick={() => navigate(VIEW.EXPLORE)}>
      <b className="brand-mark" aria-hidden="true">{COPY.brand.name.slice(0, 1).toLowerCase()}<span>·</span></b>
    </button>
  );
}

/** The main navigation bar: a floating tab bar on a phone, a side bar on a wide screen. */
export function TabBar({ current, wide, pickedCount, onCreate }: TabBarProps) {
  const active = current === VIEW.DEST || current === VIEW.DECK || current === VIEW.DESTINATIONS ? VIEW.EXPLORE : current === VIEW.TRIP || current === VIEW.TODAY || current === VIEW.EXPORT ? VIEW.TRIPS : current;
  return (
    <><nav id="tabbar" className="g-tab" aria-label={COPY.nav.label}>
      {wide ? <Brand /> : null}
      {TABS.map((t) => (
        <button key={t.view} className="tab" type="button" aria-current={active === t.view ? 'page' : undefined} onClick={() => navigate(t.view)}>
          <Icon semantic name={t.icon} />
          <span>{t.label}</span>
          {t.view === VIEW.PICKED && pickedCount > 0 ? <span className="dot">{pickedCount}</span> : null}
        </button>
      ))}
      {!wide ? <button className="tab tab-create" type="button" onClick={onCreate}><Icon name="plus" /><span>{COPY.nav.create}</span></button> : null}
      {wide ? <button className="rail-profile" type="button" aria-label={COPY.nav.settings} onClick={() => navigate(VIEW.SETTINGS)}>{COPY.brand.name.slice(0, 1)}</button> : null}
    </nav>{wide ? <button className="map-create glass-control" type="button" aria-label={COPY.nav.create} onClick={onCreate}><Icon name="plus" /></button> : null}</>
  );
}
