import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { CheckRow } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { IconName } from '../../../shared/ui/icons/iconPaths.const.ts';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useUndoable } from '../hooks/useUndoable.ts';
import { ITEM_KINDS } from '../model/trip.const.ts';
import { unassignedItems } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Một lựa chọn lớn trong tờ "Thêm vào chuyến đi". */
function AddOption({ icon, title, note, onClick }: { readonly icon: IconName; readonly title: string; readonly note: string; readonly onClick: () => void }) {
  return (
    <button className="opt addopt" type="button" onClick={onClick}>
      <span className="ib"><Icon name={icon} /></span>
      <span>
        <strong>{title}</strong>
        <span className="note">{note}</span>
      </span>
    </button>
  );
}

/** Tờ "Thêm vào chuyến đi": địa điểm từ bộ thẻ, mục tự do, nghỉ, việc cần làm. Mục mới vào ngày đang xem (nếu có). */
export function AddItemSheet({ onClose }: { readonly onClose: () => void }) {
  const { cat, tab, setOverlay, addMore } = useTripView();
  const dayNo = tab === 'ov' ? null : Number(tab);
  return (
    <Sheet label={T.add.title} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{T.add.title}</h2>
          <p className="note spaced">{dayNo ? fill(T.add.toDay, { n: dayNo }) : T.add.toUnassigned}</p>
        </div>
        <div className="stack">
          <AddOption icon="hand-finger" title={fill(T.add.place, { dest: cat.dest.name })} note={T.add.placeNote} onClick={addMore} />
          <AddOption icon="pencil" title={T.add.free} note={T.add.freeNote} onClick={() => setOverlay({ kind: 'editor', itemId: null, preset: 'sightseeing' })} />
          <AddOption icon="moon-stars" title={T.add.rest} note={T.add.restNote} onClick={() => setOverlay({ kind: 'editor', itemId: null, preset: 'rest' })} />
          <AddOption icon="list-check" title={T.add.task} note={T.add.taskNote} onClick={() => setOverlay({ kind: 'editor', itemId: null, preset: 'task' })} />
        </div>
        <Button kind="ghost" block onClick={onClose}>{T.add.cancel}</Button>
      </div>
    </Sheet>
  );
}

/** Tờ chọn ngày cho một mục ("Chưa có ngày" hoặc Ngày n); có Hoàn tác. */
export function PickDaySheet({ itemId, onClose }: { readonly itemId: string; readonly onClose: () => void }) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const { trip, cat, days } = useTripView();
  const item = trip.items.find((i) => i.id === itemId);
  if (!item) return null;
  const name = itemName(item, cat);
  const pick = (n: number): void => {
    const day = n ? (days[n - 1] ?? null) : null;
    onClose();
    if (day === item.day) return;
    undoable(trip.id, () => actions.assignDay(trip.id, itemId, day), n ? fill(T.pickDay.assigned, { n }) : T.pickDay.unassigned);
  };
  return (
    <Sheet label={fill(T.pickDay.title, { name })} onClose={onClose}>
      <div className="pp">
        <h2>{fill(T.pickDay.title, { name })}</h2>
        <div className="daylist">
          <button type="button" aria-current={item.day === null ? 'true' : undefined} onClick={() => pick(0)}>
            <span>{T.editor.noDay}</span>
          </button>
          {days.map((d, k) => (
            <button key={d} type="button" aria-current={item.day === d ? 'true' : undefined} onClick={() => pick(k + 1)}>
              <span>{fill(T.view.day, { n: k + 1 })}</span>
              <span>{dayLabel(d)}</span>
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Tờ "Thêm vào Ngày n": chọn nhiều mục chưa có ngày để xếp vào ngày đang xem. */
export function AddToDaySheet({ onClose }: { readonly onClose: () => void }) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const { trip, cat, days, tab, addMore } = useTripView();
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const n = Number(tab);
  const day = days[n - 1];
  const un = unassignedItems(trip);
  if (!day) return null;
  const submit = (): void => {
    onClose();
    if (chosen.length) undoable(trip.id, () => actions.assignMany(trip.id, chosen, day), fill(T.addToDay.added, { c: chosen.length, n }));
  };
  return (
    <Sheet label={fill(T.addToDay.title, { n })} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{fill(T.addToDay.title, { n })}</h2>
          <p className="note spaced">{T.addToDay.note}</p>
        </div>
        <div>
          {un.map((i) => {
            const p = cat.place(i.placeId);
            return (
              <CheckRow key={i.id} checked={chosen.includes(i.id)} onChange={(v) => setChosen((c) => (v ? [...c, i.id] : c.filter((x) => x !== i.id)))}>
                <b>{itemName(i, cat)}</b>
                <br />
                <span className="note">{p ? `${p.categoryName} · ${p.area}` : ITEM_KINDS[i.type].label}</span>
              </CheckRow>
            );
          })}
        </div>
        <div className="stack">
          <Button block onClick={submit}>{fill(T.addToDay.submit, { n })}</Button>
          <Button kind="ghost" block onClick={addMore}>{T.addToDay.more}</Button>
        </div>
      </div>
    </Sheet>
  );
}


export { AutoPlanSheet } from './AutoPlanSheet.tsx';
