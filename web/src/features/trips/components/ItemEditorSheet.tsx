import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, CheckRow, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { freeInput } from '../hooks/tripsActions.ts';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useTrashItem } from '../hooks/useTrashItem.ts';
import { useUndoable } from '../hooks/useUndoable.ts';
import { ITEM_KINDS, KIND_ORDER } from '../model/trip.const.ts';
import type { ItemKind, TripItem } from '../model/trip.types.ts';
import { parseItemForm, parseMoneyField } from '../model/tripForms.ts';
import type { ItemForm } from '../model/tripForms.ts';
import { isPlain } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
import { COLLAB_COPY } from '../../collab/index.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';
import { TripTimeField } from './TripTimeField.tsx';

/** Biểu mẫu ban đầu: từ mục đang sửa, hoặc mục mới với ngày của tab đang xem. */
function initialForm(item: TripItem | undefined, preset: ItemKind | null, defaultDay: string, initial?: Pick<ItemForm, 'title' | 'day'> & Partial<Pick<ItemForm, 'note'>>): ItemForm {
  return {
    title: item?.title ?? initial?.title ?? '', type: item?.type ?? preset ?? 'sightseeing', isPlace: Boolean(item?.placeId), day: item ? (item.day ?? '') : (initial?.day ?? defaultDay), time: item?.timeOfDay ?? '',
    duration: item?.durationMin == null ? '' : String(item.durationMin), note: item?.note ?? initial?.note ?? '', cost: item?.costK == null ? '' : String(item.costK), included: item?.included ?? false,
    reference: item?.referenceK == null ? '' : String(item.referenceK), booked: item?.booking === 'booked',
  };
}

/** Gợi ý dưới ô tiền: "= 150.000 ₫", hoặc nhắc quy tắc khi sai/rỗng. */
function moneyHint(text: string, emptyHint: string): string {
  if (!text.trim()) return emptyHint;
  const r = parseMoneyField(text, '');
  return r.ok && r.value !== null ? fill(T.editor.moneyHint, { money: money(r.value) }) : T.editor.moneyBad;
}

/** Mục đã có dữ liệu giá/đặt chỗ (đổi sang Nghỉ/Việc cần làm sẽ xóa nên cần xác nhận). */
function hasPriceData(item: TripItem): boolean {
  return item.costK !== null || item.included || item.referenceK !== null || item.booking === 'booked';
}

/** Tiêu đề tờ theo ngữ cảnh. */
function titleOf(isEdit: boolean, isPlace: boolean, type: ItemKind): string {
  if (isPlace) return T.editor.placeTitle;
  if (isEdit) return T.editor.editTitle;
  return type === 'rest' ? T.editor.addRest : type === 'task' ? T.editor.addTask : T.editor.addFree;
}

/** Phần giá và đặt chỗ của biểu mẫu (ẩn với Nghỉ/Việc cần làm). */
function PricedFields({ f, set }: { readonly f: ItemForm; readonly set: (p: Partial<ItemForm>) => void }) {
  return (
    <>
      <Field label={T.editor.cost} inputMode="numeric" value={f.cost} onChange={(v) => set({ cost: v })} placeholder={T.editor.costPlaceholder} hint={moneyHint(f.cost, T.editor.costHintEmpty)} />
      <CheckRow checked={f.included} onChange={(v) => set({ included: v })}>{T.editor.included}</CheckRow>
      <Field label={T.editor.reference} inputMode="numeric" value={f.reference} onChange={(v) => set({ reference: v })} hidden={!f.included} hint={f.reference ? moneyHint(f.reference, '') : undefined} />
      <div className="optgroup trip-booking">
        <span>{T.editor.booking}</span>
        <div className="chips" role="group" aria-label={T.editor.booking}>
          <ChipToggle pressed={!f.booked} onClick={() => set({ booked: false })}>{T.editor.pending}</ChipToggle>
          <ChipToggle pressed={f.booked} onClick={() => set({ booked: true })}>{T.editor.booked}</ChipToggle>
        </div>
      </div>
    </>
  );
}

/** Ô tên và loại của mục tự do (địa điểm trong kho lấy tên từ kho nên không có hai ô này). */
function FreeFields({ f, set }: { readonly f: ItemForm; readonly set: (p: Partial<ItemForm>) => void }) {
  const placeholder = f.type === 'rest' ? T.editor.placeholderRest : f.type === 'task' ? T.editor.placeholderTask : T.editor.placeholderFree;
  return (
    <>
      <Field label={T.editor.name} value={f.title} onChange={(v) => set({ title: v })} maxLength={LIMITS.MAX_ITEM_TITLE} placeholder={placeholder} />
      <Field as="select" label={T.editor.type} value={f.type} onChange={(v) => set({ type: v as ItemKind })}>
        {KIND_ORDER.map((k) => (
          <option key={k} value={k}>{ITEM_KINDS[k].label}</option>
        ))}
      </Field>
    </>
  );
}

/** Nút "Xóa khỏi chuyến đi" của một mục có sẵn: xóa mềm ngay (có Hoàn tác, D19), không hỏi lại. */
function DeleteItemButton({ item, onDone }: { readonly item: TripItem; readonly onDone: () => void }) {
  const trash = useTrashItem();
  const { trip, cat } = useTripView();
  return (
    <Button
      kind="ghost"
      block
      icon="trash"
      onClick={() => {
        if (trash(trip.id, item.id, itemName(item, cat))) onDone();
      }}
    >
      {T.trash.deleteItem}
    </Button>
  );
}

/** Tờ thêm/sửa một mục: tên và loại (mục tự do), ngày, giờ, thời lượng, ghi chú, chi phí (D17/D18), đã bao gồm + giá tham khảo, đặt chỗ. Lưu có Hoàn tác. */
export function ItemEditorSheet({ itemId, preset, initial, onClose }: { readonly itemId: string | null; readonly preset: ItemKind | null; readonly initial?: Pick<ItemForm, 'title' | 'day'> & Partial<Pick<ItemForm, 'note'>>; readonly onClose: () => void }) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const { trip, cat, days, tab, setOverlay } = useTripView();
  const item = itemId ? trip.items.find((i) => i.id === itemId) : undefined;
  const mayChange = !item || permissionsOf(trip).canChange(item);
  const defaultDay = tab === 'ov' ? '' : (days[Number(tab) - 1] ?? '');
  const [f, setF] = useState<ItemForm>(() => initialForm(item, preset, defaultDay, initial));
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const set = (p: Partial<ItemForm>): void => setF((cur) => ({ ...cur, ...p }));
  const save = (): void => {
    const parsed = parseItemForm(f);
    if (!parsed.ok) return setError(parsed.error);
    if (isPlain(f.type) && item && hasPriceData(item) && !confirmClear) {
      setConfirmClear(true);
      return setError(fill(T.editor.clearConfirm, { kind: ITEM_KINDS[f.type].label }));
    }
    const message = fill(T.editor.saved, { name: parsed.value.patch.title || (item ? itemName(item, cat) : ITEM_KINDS[f.type].label) });
    undoable(trip.id, () => (itemId ? actions.updateItem(trip.id, itemId, parsed.value.patch) : actions.addItem(trip.id, freeInput(f.type, parsed.value.patch))), message);
    onClose();
  };
  const heading = titleOf(Boolean(item), f.isPlace, f.type);
  return (
    <Sheet label={heading} onClose={onClose}>
      <div className="pp trip-editor">
        <div>
          <h2>{heading}</h2>
          {item?.placeId ? <p className="note spaced">{itemName(item, cat)}</p> : null}
        </div>
        {f.isPlace ? null : <FreeFields f={f} set={set} />}
        <Field as="select" label={T.editor.day} value={f.day} onChange={(v) => set({ day: v })}>
          <option value="">{T.editor.noDay}</option>
          {days.map((d, q) => (
            <option key={d} value={d}>{fill(T.editor.dayOption, { n: q + 1, label: dayLabel(d) })}</option>
          ))}
        </Field>
        <TripTimeField value={f.time} onChange={v => set({ time: v })} />
        {isPlain(f.type) ? null : <PricedFields f={f} set={set} />}
        <details>
          <summary>{T.create.more}</summary>
          <div className="stack spaced">
            <Field label={T.editor.duration} inputMode="numeric" value={f.duration} onChange={(v) => set({ duration: v })} placeholder={T.editor.durationPlaceholder} />
            <Field as="textarea" label={T.editor.note} rows={3} maxLength={LIMITS.MAX_ITEM_NOTE} value={f.note} onChange={(v) => set({ note: v })} />
          </div>
        </details>
        {error ? <WarnBox>{error}</WarnBox> : null}
        <div className="stack">
          {mayChange ? <Button block onClick={save}>{T.editor.save}</Button> : <WarnBox>{COLLAB_COPY.requests.notYours}</WarnBox>}
          <Button kind="ghost" block onClick={onClose}>{T.editor.cancel}</Button>
          {item && mayChange ? <DeleteItemButton item={item} onDone={onClose} /> : null}
          {item && !mayChange ? <Button kind="ghost" block icon="flag" onClick={() => setOverlay({ kind: 'requestDelete', itemId: item.id })}>{COLLAB_COPY.requests.ask}</Button> : null}
        </div>
      </div>
    </Sheet>
  );
}
