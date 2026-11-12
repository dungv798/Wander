import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { CheckRow, ChipToggle, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { firstPhotoThumbUrl } from '../../discover/index.ts';
import { useReportError } from '../../identity/index.ts';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { filterAddPlaces, missingPlaces, togglePlace, validAddDay } from '../model/addMany.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { PLACE_THUMB_SIZE } from '../list/list.const.ts';
import '../list/tripList.css';

/** Tờ chọn nơi chưa có trong chuyến; giữ lựa chọn khi tìm/lọc và chỉ ghi sau xác nhận. */
export function AddManySheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, cat, days, tab } = useTripView();
  const { actions } = useTrips();
  const toast = useToast();
  const report = useReportError();
  const [chosen, setChosen] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(() => days[Number(tab) - 1] ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const available = missingPlaces(cat.dest.places, trip);
  const selected = available.filter(place => chosen.includes(place.id));
  const visible = filterAddPlaces(available, query, category);
  const categories = [...new Map(cat.dest.places.map(place => [place.category, place.categoryName])).entries()];
  /** Tạo từng mục bằng lệnh có sẵn; lỗi giữa chừng vẫn có Hoàn tác và giữ các nơi còn lại để thử lại. */
  const submit = async (): Promise<void> => {
    if (busy || !selected.length || !validAddDay(trip, day)) return;
    setBusy(true);
    setError('');
    await actions.idle(trip.id);
    const before = actions.current(trip.id);
    let failed = false;
    try { await actions.addPlaces(trip.id, selected, day); } catch { failed = true; }
    const after = actions.current(trip.id);
    const added = selected.filter(place => after?.items.some(item => item.placeId === place.id) && !before?.items.some(item => item.placeId === place.id)).length;
    if (before && after && added) toast.show(fill(T.addMany.added, { n: added }), () => {
      if (actions.current(trip.id) === after) actions.revert(before).catch(report);
      else toast.show(T.undo.changed);
    });
    setBusy(false);
    if (failed) setError(added ? fill(T.addMany.partial, { n: added, remaining: selected.length - added }) : T.addMany.failed);
    else onClose();
  };
  return <Sheet full label={T.addMany.open} onClose={() => { if (!busy) onClose(); }}>
    <div className="add-many" aria-busy={busy}>
      <div className="add-many-head">
        <div className="headrow"><h2>{T.addMany.open}</h2><Button kind="ghost" disabled={busy} onClick={onClose}>{T.addMany.close}</Button></div>
        <label className="search trip-list-search glass-control"><Icon name="compass" /><input type="search" aria-label={T.addMany.search} placeholder={T.addMany.search} value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="trip-list-chips" role="group" aria-label={T.addMany.categories}>
          <ChipToggle pressed={category === null} onClick={() => setCategory(null)}>{T.addMany.all}</ChipToggle>
          {categories.map(([code, name]) => <ChipToggle key={code} pressed={category === code} onClick={() => setCategory(category === code ? null : code)}>{name}</ChipToggle>)}
        </div>
      </div>
      <div className="add-many-list"><fieldset disabled={busy}>
        <legend className="sr">{T.addMany.open}</legend>
        {visible.map(place => <CheckRow key={place.id} checked={chosen.includes(place.id)} onChange={() => setChosen(value => togglePlace(value, place.id))}><span className="add-many-place"><RevealImage src={firstPhotoThumbUrl(place)} width={PLACE_THUMB_SIZE} height={PLACE_THUMB_SIZE} loading="lazy" /><span><b>{place.name}</b><br /><span className="note">{place.categoryName}</span></span></span></CheckRow>)}
        {!visible.length ? <p role="status" className="note">{T.addMany.empty}</p> : null}
      </fieldset></div>
      <div className="add-many-footer glass-control">
        {error ? <WarnBox>{error}</WarnBox> : null}
        <p className="add-many-count" role="status">{fill(T.addMany.selectedCount, { n: selected.length })}</p>
        <label><span className="sr">{T.addMany.day}</span><select value={day ?? ''} disabled={busy} onChange={e => setDay(e.target.value || null)}><option value="">{T.addMany.unassigned}</option>{days.map((value, index) => <option key={value} value={value}>{fill(T.view.day, { n: index + 1 })}</option>)}</select></label>
        <Button block disabled={busy || !selected.length || !validAddDay(trip, day)} onClick={() => void submit()}>{day ? fill(T.addMany.submitDay, { n: selected.length, m: days.indexOf(day) + 1 }) : fill(T.addMany.submitUnassigned, { n: selected.length })}</Button>
      </div>
    </div>
  </Sheet>;
}
