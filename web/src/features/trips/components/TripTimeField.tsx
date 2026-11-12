import { Button } from '../../../shared/ui/Button.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { TRIP_TIME as C } from '../model/tripTime.const.ts';
import { normalizeTripTime, timeOptions } from '../model/tripTime.ts';

/** Chooses a 24h time independent of locale; quick typing 1430 and clearing both keep the HH:mm contract. */
export function TripTimeField({ value, onChange }: { readonly value: string; readonly onChange: (value: string) => void }) {
  const normalized = normalizeTripTime(value);
  const [hour = '', minute = ''] = normalized?.split(':') ?? [];
  const minutes = timeOptions(C.MINUTES, C.STEP);
  if (minute && !minutes.includes(minute)) minutes.push(minute);
  return (
    <fieldset className="trip-time">
      <legend>{T.editor.time}</legend>
      <div className="two">
        <Field as="select" label={T.editor.hour} value={hour} onChange={v => onChange(v ? `${v}:${minute || '00'}` : '')}>
          <option value="">{T.editor.unsetTime}</option>
          {timeOptions(C.HOURS).map(v => <option key={v} value={v}>{v}</option>)}
        </Field>
        <Field as="select" label={T.editor.minute} value={minute} onChange={v => onChange(v ? `${hour || '00'}:${v}` : '')}>
          <option value="">{T.editor.unsetTime}</option>
          {minutes.sort().map(v => <option key={v} value={v}>{v}</option>)}
        </Field>
      </div>
      <div className="trip-time-quick">
        <Field label={T.editor.quickTime} inputMode="numeric" maxLength={C.DIGITS} value={value.replace(':', '')} onChange={v => onChange(normalizeTripTime(v) ?? v)} placeholder={T.editor.quickTimePlaceholder} />
        <Button kind="ghost" icon="x" onClick={() => onChange('')}>{T.editor.clearTime}</Button>
      </div>
    </fieldset>
  );
}
