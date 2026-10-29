import { fullDate } from '../../../shared/lib/dates.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { ChipToggle, CheckRow } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { TRIP_PACES, TRIP_STYLES } from '../model/trip.const.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Giá trị biểu mẫu chuyến đi (chuỗi thô, kiểm ở `tripForms.ts`). */
export interface TripFormValues {
  readonly name: string;
  readonly start: string;
  readonly end: string;
  readonly tentative: boolean;
  readonly days: string;
  readonly styles: readonly string[];
  readonly pace: string | null;
  readonly budget: string;
}

interface TripFieldsProps {
  readonly suggestedDates?: boolean;
  readonly v: TripFormValues;
  readonly set: (p: Partial<TripFormValues>) => void;
  readonly budgetHint: string;
  /** Tên gợi ý hiện mờ khi chưa gõ (tên mặc định không trùng). */
  readonly namePlaceholder?: string;
}

/** Các ô của biểu mẫu tạo chuyến: tên, ngày đi/về (hoặc số ngày dự kiến khi chưa chắc), phong cách (tối đa 5), nhịp, ngân sách. */
export function TripFields({ v, set, budgetHint, namePlaceholder, suggestedDates = false }: TripFieldsProps) {
  const toggleStyle = (code: string): void => {
    const has = v.styles.includes(code);
    if (!has && v.styles.length >= LIMITS.MAX_STYLES) return;
    set({ styles: has ? v.styles.filter((s) => s !== code) : [...v.styles, code] });
  };
  return (
    <>
      <Field label={T.create.name} value={v.name} onChange={(x) => set({ name: x })} maxLength={LIMITS.MAX_TRIP_NAME} placeholder={namePlaceholder} />
      {suggestedDates ? <p className="note">{T.create.suggestedDates}</p> : null}
      <div className="two">
        <Field label={T.create.start} type="date" value={v.start} onChange={(x) => set({ start: x })} hint={fullDate(v.start)} />
        <Field label={T.create.end} type="date" value={v.end} onChange={(x) => set({ end: x })} hidden={v.tentative} hint={fullDate(v.end)} />
      </div>
      <CheckRow checked={v.tentative} onChange={(x) => set({ tentative: x })}>{T.create.tentative}</CheckRow>
      <Field label={T.create.tentativeDays} inputMode="numeric" value={v.days} onChange={(x) => set({ days: x })} hidden={!v.tentative} />
      <details>
        <summary>{T.create.more}</summary>
        <div className="stack spaced">
      <div className="optgroup">
        <span>{T.create.styles}</span>
        <div className="chips" role="group" aria-label={T.create.styles}>
          {TRIP_STYLES.map((s) => (
            <ChipToggle key={s.code} pressed={v.styles.includes(s.code)} onClick={() => toggleStyle(s.code)}>{s.label}</ChipToggle>
          ))}
        </div>
      </div>
      <div className="optgroup">
        <span>{T.create.pace}</span>
        <div className="chips" role="group" aria-label={T.create.pace}>
          {TRIP_PACES.map((p) => (
            <ChipToggle key={p.code} pressed={v.pace === p.code} onClick={() => set({ pace: v.pace === p.code ? null : p.code })}>{p.label}</ChipToggle>
          ))}
        </div>
      </div>
      <Field label={T.create.budget} inputMode="numeric" value={v.budget} onChange={(x) => set({ budget: x })} placeholder={T.create.budgetPlaceholder} hint={budgetHint} />
        </div>
      </details>
    </>
  );
}
