import { fill } from '../../../shared/const/copy.vi.ts';
import { useCountUp } from '../../../shared/hooks/useCountUp.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Progress } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { TRIP_PACES, kindLabel } from '../model/trip.const.ts';
import { dayItems, placeCount, roadKm, unassignedItems } from '../model/tripMath.ts';
import { coordOf, itemName } from '../model/tripView.ts';
import { COLLAB_COPY, collabGateway, useLoaded } from '../../collab/index.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { CostBox } from './CostBox.tsx';
import { money } from './ItemMeta.tsx';
import { COVER_COPY } from '../model/cover.copy.ts';

/** Số việc chưa xong hiện trong thẻ chuẩn bị. */
const PREPARE_PREVIEW = 3;

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
  const { trip, addMore } = useTripView();
  if (unassignedItems(trip).length) return null;
  if (!trip.items.length) {
    return (
      <div className="next">
        <span className="ib"><Icon name="plus" size="l" /></span>
        <div>
          <h3>{T.view.nextTitleEmpty}</h3>
          <p className="note">{T.view.nextTextEmpty}</p>
          <Button kind="ghost" icon="hand-finger" onClick={addMore}>{T.view.addPlaces}</Button>
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

/** Số nơi xem trước trong thẻ "Chưa xếp ngày"; phần còn lại mở trong tờ danh sách. */
const UNASSIGNED_PREVIEW = 3;

/** Thẻ "Chưa xếp ngày": số lượng, tối đa ba nơi xem trước và nút "Xếp N nơi"; không bung trình sửa hay dòng chọn ngày ở Tổng quan. */
function UnassignedCard() {
  const { trip, cat, setOverlay } = useTripView();
  const un = unassignedItems(trip);
  if (!un.length) return null;
  const rest = un.length - UNASSIGNED_PREVIEW;
  return (
    <section className="daysec unassigned-card" aria-label={T.view.unassigned}>
      <div className="dayhead">
        <h2>{T.view.unassigned}</h2>
        <span className="s">{fill(T.view.unassignedCount, { n: un.length })}</span>
      </div>
      <ul className="unassigned-preview">
        {un.slice(0, UNASSIGNED_PREVIEW).map((i) => <li key={i.id}>{itemName(i, cat)}</li>)}
        {rest > 0 ? <li className="note">{fill(T.view.unassignedMore, { n: rest })}</li> : null}
      </ul>
      <div className="two">
        {permissionsOf(trip).schedule ? <Button icon="sparkles" onClick={() => setOverlay({ kind: 'plan' })}>{fill(T.view.arrange, { n: un.length })}</Button> : null}
        <Button kind="ghost" icon="list-check" onClick={() => setOverlay({ kind: 'unassigned' })}>{T.view.unassignedOpen}</Button>
      </div>
    </section>
  );
}

/** Thẻ "Chuẩn bị & nhóm": tiến độ checklist của mình, vài việc kế tiếp, một lối mời bạn; danh sách đầy đủ mở trong tờ riêng. */
function PrepareCard() {
  const { trip, setOverlay } = useTripView();
  const list = useLoaded(() => collabGateway.checklist(trip.id), [trip.id]);
  const requests = useLoaded(() => collabGateway.requests(trip.id), [trip.id, trip.items.length, trip.trash.length]);
  const items = list.data ?? [];
  const todo = items.filter((i) => !i.done);
  const pending = requests.data?.filter((r) => r.status === 'pending').length ?? 0;
  const organizer = permissionsOf(trip).organizer;
  return (
    <section className="seccard prepare-card" id="trip-preparation" aria-label={T.view.prepareTitle}>
      <h2>{T.view.prepareTitle}</h2>
      {items.length ? (
        <>
          <p className="note">{fill(T.view.prepareProgress, { done: items.length - todo.length, total: items.length })}</p>
          <Progress label={T.view.prepareTitle} value={items.length - todo.length} max={items.length} />
          <ul className="unassigned-preview">{todo.slice(0, PREPARE_PREVIEW).map((i) => <li key={i.id}>{i.title}</li>)}</ul>
        </>
      ) : <p className="note">{organizer ? T.view.prepareEmpty : T.view.prepareEmptyMember}</p>}
      <div className="two">
        {items.length || organizer ? <Button kind="ghost" icon="check" onClick={() => setOverlay({ kind: 'checklist' })}>{T.view.prepareOpen}</Button> : null}
        <Button kind="ghost" icon="users" onClick={() => setOverlay({ kind: 'people' })}>{trip.memberCount > 1 ? fill(COLLAB_COPY.people.open, { n: trip.memberCount }) : T.create.invite}</Button>
      </div>
      {organizer || requests.data?.length ? <Button kind="ghost" block icon="flag" onClick={() => setOverlay({ kind: 'requests' })}>{fill(organizer ? COLLAB_COPY.requests.open : COLLAB_COPY.requests.openMine, { n: pending })}</Button> : null}
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

/** Nút "Xóa chuyến đi" (xóa mềm, có Hoàn tác) ở cuối tab Tổng quan; chỉ Organizer. */
function DeleteTripLink() {
  const { trip, setOverlay } = useTripView();
  if (!permissionsOf(trip).manageTrip) return null;
  return (
    <Button kind="ghost" block icon="trash" onClick={() => setOverlay({ kind: 'deleteTrip' })}>
      {T.deleteTrip.open}
    </Button>
  );
}

/** Khu quản lý ít dùng, gập sẵn: tùy chỉnh bìa, đã xóa gần đây, xóa chuyến. */
function ManageMenu() {
  const { trip, setOverlay } = useTripView();
  return (
    <>
      {trip.trash.length ? <TrashLink /> : null}
    <details className="manage-menu">
      <summary><Icon name="chevron-down" size="s" />{T.view.manage}</summary>
      <div className="stack tight">
        {permissionsOf(trip).manageTrip ? <Button kind="ghost" block icon="pencil" onClick={() => setOverlay({ kind: 'cover' })}>{COVER_COPY.title}</Button> : null}
        {trip.trash.length ? null : <TrashLink />}
        <DeleteTripLink />
      </div>
    </details>
    </>
  );
}

/** Tab "Tổng quan" dạng bảng gọn: việc kế tiếp, tóm tắt chuyến + lịch từng ngày, chưa xếp ngày, chi phí, chuẩn bị/nhóm, rồi khu quản lý gập sẵn. */
export function OverviewTab() {
  return (
    <>
      <NextStep />
      <StatsAndRoutes />
      <TripOptions />
      <UnassignedCard />
      <CostBox />
      <PrepareCard />
      <ManageMenu />
    </>
  );
}
