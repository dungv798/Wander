import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { unassignedItems } from '../model/tripMath.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { AddManyEntry } from './AddManyEntry.tsx';
import { ChecklistSection } from './ChecklistSection.tsx';
import { ItemRow } from './ItemRow.tsx';

/** Tờ danh sách đầy đủ các nơi "Chưa xếp ngày": mỗi hàng có nút chọn ngày; Tổng quan chỉ hiện ba nơi đầu. */
export function UnassignedSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, setOverlay } = useTripView();
  const un = unassignedItems(trip);
  return (
    <Sheet label={T.view.unassigned} onClose={onClose}>
      <div className="pp">
        <div className="headrow"><h2>{fill(T.view.unassignedCount, { n: un.length })}</h2><Button kind="ghost" onClick={onClose}>{T.addMany.close}</Button></div>
        <AddManyEntry />
        {un.length ? un.map((i) => <ItemRow key={i.id} item={i} num={null} assignable />) : <div className="emptyday">{trip.items.length ? T.view.allAssigned : T.view.noPlaces}</div>}
        <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'add' })}>{T.view.addItem}</Button>
      </div>
    </Sheet>
  );
}

/** Tờ checklist đầy đủ: danh sách dài và biểu mẫu thêm hạng mục nằm ở đây thay vì trên Tổng quan. */
export function ChecklistSheet({ onClose }: { readonly onClose: () => void }) {
  return (
    <Sheet label={T.view.checklistTitle} onClose={onClose}>
      <div className="pp">
        <div className="headrow"><span /><Button kind="ghost" onClick={onClose}>{T.addMany.close}</Button></div>
        <ChecklistSection />
      </div>
    </Sheet>
  );
}
