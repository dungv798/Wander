import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { addDays, nextWeekday, todayLocal } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useDestination, useDiscover } from '../../discover/index.ts';
import { useRequireIdentity } from '../../identity/index.ts';
import type { PlaceRef } from '../model/tripState.ts';
import { useReportError } from '../../identity/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { DEFAULT_START_WEEKDAY, DEFAULT_TRIP_DAYS } from '../model/trip.const.ts';
import { parseDates, parseMoneyField, parseTripName } from '../model/tripForms.ts';
import { uniqueName } from '../model/tripState.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { TripFields } from './TripFields.tsx';
import type { TripFormValues } from './TripFields.tsx';

type Mode = 'new' | 'add' | 'keep';

interface CreateTripSheetProps {
  readonly destId: string;
  /** Các nơi đã chọn đang lưu (rỗng = tạo chuyến trống). */
  readonly picked: readonly (PlaceRef & { readonly name: string })[];
  readonly onClose: () => void;
}

/** Lời nhắc dưới ô ngân sách khi giá trị nhập sai (rỗng khi ổn hoặc để trống). */
function budgetHint(text: string): string {
  const r = parseMoneyField(text, '');
  return r.ok ? '' : r.error;
}

/** Giá trị mặc định của biểu mẫu: thứ Bảy tới, 3 ngày, tên không trùng. */
function defaultValues(): TripFormValues {
  const start = nextWeekday(todayLocal(), DEFAULT_START_WEEKDAY);
  return { name: '', start, end: addDays(start, DEFAULT_TRIP_DAYS - 1), tentative: false, days: String(DEFAULT_TRIP_DAYS), styles: [], pace: null, budget: '' };
}

/** Ba lựa chọn khi có nơi đã chọn: tạo chuyến mới, thêm vào chuyến sẵn có, hoặc để lại. */
function ModeOption({ mode, current, title, children, onPick }: { readonly mode: Mode; readonly current: Mode; readonly title: string; readonly children: React.ReactNode; readonly onPick: (m: Mode) => void }) {
  const on = mode === current;
  return (
    <div
      className={on ? 'opt on' : 'opt'}
      role="radio"
      aria-checked={on}
      tabIndex={0}
      onClick={() => onPick(mode)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        onPick(mode);
      }}
    >
      <span className="rd" />
      <div>
        <strong>{title}</strong>
        {on || mode === 'keep' ? children : null}
      </div>
    </div>
  );
}

/** Ba cách xử lý các nơi đã chọn: tạo chuyến mới (kèm biểu mẫu), thêm vào chuyến sẵn có (nếu có), hoặc để lại. */
function PickedModes({ mode, onMode, form, trips, tripId, onTrip }: { readonly mode: Mode; readonly onMode: (m: Mode) => void; readonly form: React.ReactNode; readonly trips: readonly { readonly id: string; readonly name: string }[]; readonly tripId: string; readonly onTrip: (id: string) => void }) {
  return (
    <div className="stack" role="radiogroup" aria-label={T.create.modeGroup}>
      <ModeOption mode="new" current={mode} title={T.create.modeNew} onPick={onMode}>
        <div className="more-f">{form}</div>
      </ModeOption>
      {trips.length ? (
        <ModeOption mode="add" current={mode} title={T.create.modeAdd} onPick={onMode}>
          <div className="more-f">
            <Field as="select" label={T.create.pickTrip} value={tripId} onChange={onTrip}>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Field>
          </div>
        </ModeOption>
      ) : null}
      <ModeOption mode="keep" current={mode} title={T.create.modeKeep} onPick={onMode}>
        <p className="note">{T.create.modeKeepNote}</p>
      </ModeOption>
    </div>
  );
}

/** Kết thúc tạo/lưu: bỏ các nơi đã lưu khỏi "Đã chọn", đóng tờ, mở chuyến và báo đã lưu. */
function useFinish(picked: readonly PlaceRef[], onClose: () => void): { readonly finish: (id: string, name: string) => void; readonly keep: () => void } {
  const discover = useDiscover();
  const toast = useToast();
  return {
    finish: (id, name) => {
      discover.actions.clearPicked(picked.map((p) => p.id));
      onClose();
      navigate(VIEW.TRIP, id, 'ov');
      toast.show(fill(T.create.saved, { name }));
    },
    keep: () => {
      onClose();
      toast.show(T.create.kept);
    },
  };
}

/**
 * Tờ "Tạo chuyến đi" / "Lưu N địa điểm thành chuyến đi?". Có nơi đã chọn thì có ba cách: chuyến mới, thêm vào chuyến sẵn có, giữ lại.
 * Chuyến mới nhận các nơi ở mục "Chưa có ngày". Lưu xong gỡ các nơi đó khỏi "Đã chọn" và mở chuyến. Chưa có danh tính ẩn danh thì hỏi lưu lần đầu trước (F2).
 */
export function CreateTripSheet({ destId, picked, onClose }: CreateTripSheetProps) {
  const { state, actions } = useTrips();
  const requireIdentity = useRequireIdentity();
  const { state: destState } = useDestination(destId);
  const destName = destState.status === 'ready' ? destState.data.name : '';
  const [mode, setMode] = useState<Mode>('new');
  const [v, setV] = useState<TripFormValues>(defaultValues);
  const [tripId, setTripId] = useState(state.trips[0]?.id ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const report = useReportError();
  const set = (p: Partial<TripFormValues>): void => setV((cur) => ({ ...cur, ...p }));
  const hasPicked = picked.length > 0;
  const defaultName = uniqueName(state.trips, destName);

  const { finish, keep } = useFinish(picked, onClose);

  const submit = (): void => {
    if (hasPicked && mode === 'keep') return keep();
    if (hasPicked && mode === 'add') {
      const t = state.trips.find((x) => x.id === tripId);
      if (!t) return;
      setBusy(true);
      actions.addPlaces(t.id, picked).then(() => finish(t.id, t.name)).catch(report).finally(() => setBusy(false));
      return;
    }
    const name = parseTripName(v.name.trim() || defaultName);
    if (!name.ok) return setError(name.error);
    const dates = parseDates({ start: v.start, end: v.end, tentative: v.tentative, days: v.days });
    if (!dates.ok) return setError(dates.error);
    const bud = parseMoneyField(v.budget, T.create.budget);
    if (!bud.ok) return setError(bud.error);
    requireIdentity(() => {
      setBusy(true);
      return actions.create({ name: name.value, destinationId: destId, ...dates.value, styles: v.styles, pace: v.pace, budgetK: bud.value }, picked).then((trip) => {
        finish(trip.id, trip.name);
        return true;
      }).catch((e: unknown) => {
        report(e);
        return false;
      }).finally(() => setBusy(false));
    });
  };

  const heading = hasPicked ? fill(T.create.titleSave, { n: picked.length }) : T.create.title;
  const form = <TripFields v={v} set={set} budgetHint={budgetHint(v.budget)} namePlaceholder={defaultName} />;
  return (
    <Sheet label={heading} onClose={onClose}>
      <div className="pp">
        <div>
          <h2>{heading}</h2>
          <p className="note spaced">{hasPicked ? T.create.subtitleSave : fill(T.create.subtitleEmpty, { dest: destName })}</p>
        </div>
        {hasPicked ? <PickedModes mode={mode} onMode={setMode} form={form} trips={state.trips} tripId={tripId} onTrip={setTripId} /> : form}
        {error ? <WarnBox>{error}</WarnBox> : null}
        <div className="stack">
          <Button block disabled={busy} onClick={submit}>{hasPicked ? T.create.confirm : T.create.submit}</Button>
          <Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>
        </div>
      </div>
    </Sheet>
  );
}

