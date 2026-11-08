import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { permissionsOf } from '../model/tripPermissions.ts';
import { unassignedItems } from '../model/tripMath.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { AddManyEntry } from './AddManyEntry.tsx';
import { ItemRow } from './ItemRow.tsx';

/**
 * Chế độ "Chưa xếp": MỌI nơi chưa có ngày, mỗi hàng có chọn nhanh ngày; "Xếp giúp tôi" mở xem trước gợi ý
 * (áp dụng được và Hoàn tác được ở tờ gợi ý hiện có). Cùng dữ liệu và quyền với tờ danh sách cũ, nhưng nằm ngay trong chuyến thay vì trong tờ phủ.
 */
export function UnassignedTab() {
  const { trip, setOverlay } = useTripView();
  const un = unassignedItems(trip);
  const canSchedule = permissionsOf(trip).schedule;
  return (
    <section className="daysec unassigned-tab" aria-label={T.view.unassigned}>
      <div className="dayhead">
        <h2>{T.view.unassigned}</h2>
        <span className="s">{fill(T.view.unassignedCount, { n: un.length })}</span>
      </div>
      <div className="unassigned-tools">
        {un.length && canSchedule ? <Button arrow icon="sparkles" onClick={() => setOverlay({ kind: 'plan' })}>{fill(T.view.arrange, { n: un.length })}</Button> : null}
        <AddManyEntry />
      </div>
      {un.length ? un.map((i) => <ItemRow key={i.id} item={i} num={null} assignable />) : <div className="emptyday">{trip.items.length ? T.view.allAssigned : T.view.noPlaces}</div>}
      <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'add' })}>{T.view.addItem}</Button>
    </section>
  );
}
