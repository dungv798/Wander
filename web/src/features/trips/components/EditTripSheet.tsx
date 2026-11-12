import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { fullDate, inclusiveDays } from '../../../shared/lib/dates.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { CheckRow, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { useUndoable } from '../hooks/useUndoable.ts';
import { parseDates, parseTripName } from '../model/tripForms.ts';
import { editTrip } from '../model/tripState.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/**
 * The 'Edit trip' sheet: name, start/end dates, confirming the dates (drop the 'tentative' label), moving the schedule to the new dates. Items on a day that is cut go back to 'no date yet'
 * instead of blocking (DR-011 A1); it reports the number of items affected and requires pressing Save once more to confirm; it has Undo.
 */
export function EditTripSheet({ onClose }: { readonly onClose: () => void }) {
  const { actions } = useTrips();
  const undoable = useUndoable();
  const { trip, setTab, tab } = useTripView();
  const [name, setName] = useState(trip.name);
  const [start, setStart] = useState(trip.startDate);
  const [end, setEnd] = useState(trip.endDate);
  const [sure, setSure] = useState(false);
  const [shift, setShift] = useState(true);
  const [error, setError] = useState('');
  const [confirmedLost, setConfirmedLost] = useState('');

  const save = (): void => {
    const n = parseTripName(name);
    if (!n.ok) return setError(n.error);
    const d = parseDates({ start, end, tentative: false, days: '' });
    if (!d.ok) return setError(d.error);
    const preview = editTrip(trip, { name: n.value, startDate: start, endDate: end, shift, confirmDates: sure });
    const lostKey = preview.lostIds.join(',');
    if (preview.lost && confirmedLost !== lostKey) {
      setConfirmedLost(lostKey);
      return setError(fill(T.editTrip.lost, { n: preview.lost }));
    }
    undoable(trip.id, () => actions.editTrip(trip.id, { name: n.value, startDate: start, endDate: end, shift, confirmDates: sure }), T.editTrip.saved);
    if (tab !== 'ov' && Number(tab) > inclusiveDays(d.value.startDate, d.value.endDate)) setTab('ov');
    onClose();
  };

  return (
    <Sheet label={T.editTrip.title} onClose={onClose}>
      <div className="pp">
        <h2>{T.editTrip.title}</h2>
        <Field label={T.create.name} value={name} onChange={setName} maxLength={LIMITS.MAX_TRIP_NAME} />
        <div className="two">
          <Field label={T.create.start} type="date" value={start} onChange={setStart} hint={fullDate(start)} />
          <Field label={T.create.end} type="date" value={end} onChange={setEnd} hint={fullDate(end)} />
        </div>
        {trip.datesTentative ? <CheckRow checked={sure} onChange={setSure}>{T.editTrip.confirmDates}</CheckRow> : null}
        <CheckRow checked={shift} onChange={setShift}>{T.editTrip.shift}</CheckRow>
        {error ? <WarnBox>{error}</WarnBox> : null}
        <div className="stack">
          <Button block onClick={save}>{T.editTrip.save}</Button>
          <Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>
        </div>
      </div>
    </Sheet>
  );
}
