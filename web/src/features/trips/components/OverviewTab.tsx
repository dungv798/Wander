import { fill } from '../../../shared/const/copy.vi.ts';
import { useCountUp } from '../../../shared/hooks/useCountUp.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Progress } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { TRIP_PACES, kindLabel } from '../model/trip.const.ts';
import { dayItems, placeCount, roadKm, unassignedItems } from '../model/tripMath.ts';
import { coordOf } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { CostBox } from './CostBox.tsx';
import { ItemRow } from './ItemRow.tsx';
import { money } from './ItemMeta.tsx';

/** Một ô số liệu (đếm lên từ 0 khi hiện). */
function Stat({ value, label, cls, prefix = '' }: { readonly value: number; readonly label: string; readonly cls: string; readonly prefix?: string }) {
  return (
    <div className={`stat ${cls}`}>
      <b>{`${prefix}${useCountUp(value)}`}</b>
      <span>{label}</span>
    </div>
  );
}

/** Thẻ gợi ý việc kế tiếp: xếp ngày giúp, thêm địa điểm hoặc (khi đã xếp xong) nhắc việc tiếp theo. */
function NextStep() {
  const { trip, setOverlay, addMore } = useTripView();
  const un = unassignedItems(trip);
  if (un.length) {
    return (
      <div className="next">
        <span className="ib"><Icon name="wand" size="l" /></span>
        <div>
          <h3>{fill(T.view.nextTitleUnassigned, { n: un.length })}</h3>
          <p className="note">{T.view.nextTextUnassigned}</p>
          <Button icon="sparkles" onClick={() => setOverlay({ kind: 'plan' })}>{T.view.autoPlan}</Button>
        </div>
      </div>
    );
  }
  if (!trip.items.length) {
    return (
      <div className="next">
        <span className="ib"><Icon name="plus" size="l" /></span>
        <div>
          <h3>{T.view.nextTitleEmpty}</h3>
          <p className="note">{T.view.nextTextEmpty}</p>
          <Button icon="hand-finger" onClick={addMore}>{T.view.addPlaces}</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="next">
      <span className="ib"><Icon name="check" size="l" /></span>
      <div>
        <h3>{T.view.nextTitleAll}</h3>
        <p className="note">{T.view.nextTextAll}</p>
      </div>
    </div>
  );
}

/** Ba số liệu (địa điểm, ngày, km ước tính) và các chip tuyến theo ngày. */
function StatsAndRoutes() {
  const { trip, cat, days, setTab } = useTripView();
  const coord = coordOf(cat);
  const perDay = days.map((d) => roadKm(dayItems(trip, d), coord));
  const totalKm = Math.round(perDay.reduce((a, b) => a + b, 0));
  return (
    <>
      <div className="stats">
        <Stat value={placeCount(trip)} label={T.view.statPlaces} cls="cat-canh" />
        <Stat value={days.length} label={T.view.statDays} cls="cat-van" />
        <Stat value={totalKm} label={T.view.statKm} cls="cat-leo" prefix="~" />
      </div>
      {days.length > 1 ? (
        <div className="dayroutes">
          <h2 className="h3">
            {T.view.dayRoutes} <small>{T.view.dayRoutesNote}</small>
          </h2>
          <div className="chips" role="group" aria-label={T.view.dayRoutesPick}>
            {perDay.map((km, k) => (
              <button key={days[k]} className="dchip" type="button" onClick={() => setTab(String(k + 1))}>
                {km > 0 ? fill(T.view.dayRouteKm, { n: k + 1, km: Math.round(km) }) : fill(T.view.dayRouteNone, { n: k + 1 })}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Các nhãn tùy chọn của chuyến (kiểu, sở thích, phong cách, nhịp, ngân sách); không hiện khi trống. */
function TripOptions() {
  const { trip, cat } = useTripView();
  const names = new Map<string, string>(cat.dest.places.map((p) => [p.category, p.categoryName]));
  const pace = TRIP_PACES.find((p) => p.code === trip.pace)?.label;
  const has = trip.kind || trip.interests.length || trip.styles.length || pace || trip.budgetK !== null;
  if (!has) return null;
  return (
    <div className="chips">
      {trip.kind ? <span className="chip tint cat-luu">{fill(T.view.kindChip, { kind: kindLabel(trip.kind) })}</span> : null}
      {trip.interests.map((k) => (
        <span key={k} className={`chip tint cat-${k}`}>{names.get(k) ?? k}</span>
      ))}
      {pace ? <span className="chip tint cat-luu">{fill(T.view.paceChip, { pace: pace.toLowerCase() })}</span> : null}
      {trip.budgetK !== null ? <span className="chip tint cat-am">{fill(T.view.budgetChip, { money: money(trip.budgetK) })}</span> : null}
    </div>
  );
}

/** Mục "Chưa có ngày": tiến độ xếp ngày, danh sách mục kèm hàng "Chọn ngày", nút thêm mục tự do. */
function UnassignedSection() {
  const { trip, setOverlay } = useTripView();
  const un = unassignedItems(trip);
  const assigned = trip.items.length - un.length;
  return (
    <section className="daysec">
      <div className="dayhead">
        <h2>{T.view.unassigned}</h2>
        <span className="s">{fill(T.view.assigned, { a: assigned, t: trip.items.length })}</span>
      </div>
      <Progress label={T.view.assignedLabel} value={assigned} max={trip.items.length} />
      {un.length ? un.map((i) => <ItemRow key={i.id} item={i} num={null} assignable />) : <div className="emptyday">{trip.items.length ? T.view.allAssigned : T.view.noPlaces}</div>}
      <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'add' })}>{T.view.addItem}</Button>
    </section>
  );
}

/** Lối vào "Đã xóa gần đây (n)" ở cuối tab Tổng quan. */
function TrashLink() {
  const { trip, setOverlay } = useTripView();
  const toast = useToast();
  return (
    <Button
      kind="ghost"
      block
      icon="trash"
      onClick={() => {
        toast.dismiss(); // thông báo "Đã xóa … Hoàn tác" không che danh sách; danh sách này chính là nơi khôi phục
        setOverlay({ kind: 'trash' });
      }}
    >
      {trip.trash.length ? fill(T.trash.link, { n: trip.trash.length }) : T.trash.linkNone}
    </Button>
  );
}

/** Tab "Tổng quan": việc kế tiếp, số liệu, tuyến theo ngày, tùy chọn chuyến, chi phí, các mục chưa có ngày. */
export function OverviewTab() {
  return (
    <>
      <NextStep />
      <StatsAndRoutes />
      <TripOptions />
      <CostBox />
      <UnassignedSection />
      <TrashLink />
    </>
  );
}

