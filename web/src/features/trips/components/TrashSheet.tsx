import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { EmptyState } from '../../../shared/ui/EmptyState.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { CATEGORY_ICON } from '../../discover/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useUndoable } from '../hooks/useUndoable.ts';
import { ITEM_KINDS } from '../model/trip.const.ts';
import type { TrashEntry } from '../model/trip.types.ts';
import { agoText, isDuplicateRestore } from '../model/tripTrash.ts';
import { itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

interface RowProps {
  readonly entry: TrashEntry;
  /** Giờ hiện tại lúc mở tờ (chữ "x phút trước" không đổi mỗi lần vẽ lại). */
  readonly now: number;
  readonly onRestore: (entry: TrashEntry) => void;
  readonly onPurge: (entry: TrashEntry) => void;
}

/** Một mục đã xóa: ảnh/biểu tượng, loại, tên, "Bạn xóa … trước" và hai nút Khôi phục / Xóa vĩnh viễn. */
function TrashRow({ entry, now, onRestore, onPurge }: RowProps) {
  const { cat } = useTripView();
  const item = entry.item;
  const place = cat.place(item.placeId);
  const kind = ITEM_KINDS[item.type];
  const name = itemName(item, cat);
  const photo = place?.photos[0]?.url;
  return (
    <li className={`trashrow irow ${place ? `cat-${place.category}` : kind.cat}`}>
      <div className={photo ? 'im' : 'im ktile'}>{photo ? <img alt="" src={photo} /> : <Icon name={kind.icon} size="l" />}</div>
      <div className="tx">
        <span className="kind">
          <Icon name={place ? CATEGORY_ICON[place.category] : kind.icon} size="s" />
          {place ? place.categoryName : kind.label}
        </span>
        <h3>{name}</h3>
        <p className="note">{fill(T.trash.deletedAt, { when: agoText(entry.deletedAt, now) })}</p>
        <div className="acts">
          <Button kind="ghost" aria-label={fill(T.trash.restoreAria, { name })} onClick={() => onRestore(entry)}>
            {T.trash.restore}
          </Button>
          <Button kind="danger" aria-label={fill(T.trash.purgeAria, { name })} onClick={() => onPurge(entry)}>
            {T.trash.purge}
          </Button>
        </div>
      </div>
    </li>
  );
}

/** Hộp xác nhận xóa vĩnh viễn một mục (chỉ cần xác nhận, không xác thực lại: DR-011 B1). */
function PurgeConfirm({ name, onYes, onNo }: { readonly name: string; readonly onYes: () => void; readonly onNo: () => void }) {
  return (
    <div className="pp">
      <div>
        <h2>{fill(T.trash.purgeTitle, { name })}</h2>
        <p className="note spaced">{T.trash.purgeText}</p>
      </div>
      <div className="stack">
        <Button kind="danger" block onClick={onYes}>
          {T.trash.purge}
        </Button>
        <Button kind="ghost" block onClick={onNo}>
          {T.trash.cancel}
        </Button>
      </div>
    </div>
  );
}

/** Tờ "Đã xóa gần đây": các mục xóa mềm của chuyến, giữ đến khi xóa vĩnh viễn (D19). Khôi phục có Hoàn tác; xóa vĩnh viễn hỏi xác nhận. */
export function TrashSheet({ onClose }: { readonly onClose: () => void }) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const toast = useToast();
  const report = useReportError();
  const { trip, cat, days } = useTripView();
  const [purging, setPurging] = useState<TrashEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  /** Khôi phục một mục (có Hoàn tác); nói rõ khi ngày cũ không còn nên mục về "Chưa có ngày". */
  const restore = (entry: TrashEntry): void => {
    const name = itemName(entry.item, cat);
    if (isDuplicateRestore(trip, entry)) {
      toast.show(fill(T.trash.duplicate, { name }));
      return;
    }
    const dayLost = entry.day !== null && !days.includes(entry.day);
    if (busy) return;
    setBusy(true);
    undoable(trip.id, () => actions.restoreItem(trip.id, entry.id).finally(() => setBusy(false)), fill(dayLost ? T.trash.restoredNoDay : T.trash.restored, { name }));
  };
  /** Xóa vĩnh viễn rồi quay lại danh sách. */
  const purge = (entry: TrashEntry): void => {
    if (busy) return;
    setBusy(true);
    actions.purgeItem(trip.id, entry.id).then(() => {
      toast.show(fill(T.trash.purged, { name: itemName(entry.item, cat) }));
      setPurging(null);
    }).catch(report).finally(() => setBusy(false));
  };

  return (
    <Sheet label={T.trash.title} onClose={onClose}>
      {purging ? (
        <PurgeConfirm name={itemName(purging.item, cat)} onYes={() => purge(purging)} onNo={() => setPurging(null)} />
      ) : (
        <div className="pp">
          <div>
            <h2>{T.trash.title}</h2>
            <p className="note spaced">{`${T.trash.note} ${T.trash.noteCreator}`}</p>
          </div>
          {trip.trash.length ? (
            <ul className="stack trashlist">
              {trip.trash.map((e) => (
                <TrashRow key={e.id} entry={e} now={now} onRestore={restore} onPurge={setPurging} />
              ))}
            </ul>
          ) : (
            <EmptyState role="status" title={T.trash.emptyTitle} text={T.trash.emptyText} />
          )}
          <Button kind="ghost" block onClick={onClose}>
            {T.trash.close}
          </Button>
        </div>
      )}
    </Sheet>
  );
}
