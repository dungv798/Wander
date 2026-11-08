import { useRef, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { addDays, dayMonth, fullDate, nextWeekday, todayLocal } from '../../../shared/lib/dates.ts';
import { ChipToggle, CheckRow, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useRequireIdentity } from '../../identity/index.ts';
import { CATEGORY_ICON, COMING_SOON, useDestination } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { useCreateTripFlow } from '../hooks/useCreateTripFlow.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { DEFAULT_START_WEEKDAY, DEFAULT_TRIP_DAYS, TRIP_KINDS, WIZARD_STEPS, kindLabel } from '../model/trip.const.ts';
import type { WizardStep } from '../model/trip.const.ts';
import { parseDates, parseMoneyField, parseTripName } from '../model/tripForms.ts';
import { uniqueName } from '../model/tripState.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import type { TripFormValues } from './TripFields.tsx';
import type { PlaceRef } from '../model/tripState.ts';
import { TripFormActions, TripFormLayout } from './TripFormLayout.tsx';
import { money } from './ItemMeta.tsx';

const PERCENT = 100;

/** Dữ liệu qua các bước. */
interface Draft {
  readonly start: string;
  readonly end: string;
  readonly tentative: boolean;
  readonly days: string;
  readonly kind: string | null;
  readonly interests: readonly string[];
  readonly budget: string;
  readonly name: string;
}

/** Giá trị ban đầu: thứ Bảy tới, 3 ngày. */
function initialDraft(): Draft {
  const start = nextWeekday(todayLocal(), DEFAULT_START_WEEKDAY);
  return { start, end: addDays(start, DEFAULT_TRIP_DAYS - 1), tentative: false, days: String(DEFAULT_TRIP_DAYS), kind: null, interests: [], budget: '', name: '' };
}

/** Lỗi của bước hiện tại (rỗng nếu ổn): ngày ở bước "Khi nào", ngân sách ở bước "Ngân sách". */
function stepError(step: WizardStep, d: Draft): string {
  if (step === 'when') {
    const r = parseDates({ start: d.start, end: d.end, tentative: d.tentative, days: d.days });
    return r.ok ? '' : r.error;
  }
  if (step === 'budget') {
    const r = parseMoneyField(d.budget, T.create.budget);
    return r.ok ? '' : r.error;
  }
  return '';
}

/** Thân từng bước của trình tạo chuyến. */
function StepBody({ step, d, set, dest, defaultName }: { readonly step: WizardStep; readonly d: Draft; readonly set: (p: Partial<Draft>) => void; readonly dest: DestinationDetail | null; readonly defaultName: string }) {
  const cats = [...new Map((dest?.places ?? []).map((p) => [p.category, p.categoryName])).entries()];
  if (step === 'where') {
    return (
      <>
        <div className="opt on">
          <span className="rd" />
          <div>
            <strong>{dest?.name}</strong>
            <p className="note">{T.wizard.whereNote}</p>
          </div>
        </div>
        <p className="note">{fill(T.wizard.soon, { list: COMING_SOON.join(', ') })}</p>
      </>
    );
  }
  if (step === 'when') {
    return (
      <>
        <div className="two">
          <Field label={T.create.start} type="date" value={d.start} onChange={(x) => set({ start: x })} hint={fullDate(d.start)} />
          <Field label={T.create.end} type="date" value={d.end} onChange={(x) => set({ end: x })} hidden={d.tentative} hint={fullDate(d.end)} />
        </div>
        <CheckRow checked={d.tentative} onChange={(x) => set({ tentative: x })}>{T.create.tentative}</CheckRow>
        <Field label={T.create.tentativeDays} inputMode="numeric" value={d.days} onChange={(x) => set({ days: x })} hidden={!d.tentative} />
      </>
    );
  }
  if (step === 'who') {
    return (
      <>
        <p className="note">{T.wizard.whoNote}</p>
        <div className="chips" role="group" aria-label={T.wizard.whoGroup}>
          {TRIP_KINDS.map((k) => (
            <ChipToggle key={k.code} pressed={d.kind === k.code} onClick={() => set({ kind: d.kind === k.code ? null : k.code })}>{k.label}</ChipToggle>
          ))}
        </div>
      </>
    );
  }
  if (step === 'interests') {
    return (
      <>
        <p className="note">{T.wizard.interestsNote}</p>
        <div className="chips" role="group" aria-label={T.wizard.interestsGroup}>
          {cats.map(([code, name]) => (
            <ChipToggle key={code} icon={CATEGORY_ICON[code as keyof typeof CATEGORY_ICON]} pressed={d.interests.includes(code)} onClick={() => set({ interests: d.interests.includes(code) ? d.interests.filter((x) => x !== code) : [...d.interests, code] })}>{name}</ChipToggle>
          ))}
        </div>
      </>
    );
  }
  if (step === 'budget') return <Field label={T.create.budget} inputMode="numeric" placeholder={T.create.budgetPlaceholder} value={d.budget} onChange={(x) => set({ budget: x })} />;
  return <Summary d={d} set={set} dest={dest} defaultName={defaultName} cats={cats} />;
}

/** Bước cuối: tóm tắt các lựa chọn và ô đặt tên. */
function Summary({ d, set, dest, defaultName, cats }: { readonly d: Draft; readonly set: (p: Partial<Draft>) => void; readonly dest: DestinationDetail | null; readonly defaultName: string; readonly cats: readonly (readonly [string, string])[] }) {
  const names = new Map(cats);
  const budget = parseMoneyField(d.budget, '');
  return (
    <>
      <ul className="wzsum">
        <li><b>{T.wizard.summaryDest}</b> {dest?.name}</li>
        <li><b>{T.wizard.summaryDates}</b> {d.tentative ? fill(T.wizard.tentativeSummary, { n: d.days, start: dayMonth(d.start) }) : `${fullDate(d.start)} – ${fullDate(d.end)}`}</li>
        <li><b>{T.wizard.summaryKind}</b> {d.kind ? kindLabel(d.kind) : T.wizard.notChosen}</li>
        <li><b>{T.wizard.summaryInterests}</b> {d.interests.length ? d.interests.map((k) => names.get(k) ?? k).join(', ') : T.wizard.notChosen}</li>
        <li><b>{T.wizard.summaryBudget}</b> {budget.ok && budget.value !== null ? money(budget.value) : T.wizard.notSet}</li>
      </ul>
      <Field label={T.create.name} value={d.name} onChange={(x) => set({ name: x })} maxLength={LIMITS.MAX_TRIP_NAME} placeholder={defaultName} />
    </>
  );
}

/**
 * Trình tạo chuyến theo 6 bước (Đi đâu → Khi nào → Ai đi → Sở thích → Ngân sách → Xem lại). "Ai đi" là kiểu chuyến, chưa phải thành viên;
 * kiểu chuyến và sở thích LƯU vào chuyến (DR-018 F2). Mỗi bước kiểm lỗi trước khi sang bước sau; tiêu đề bước nhận focus để đọc màn hình.
 */
export function TripWizard({ destId, onClose, picked = [], values, onValues, onBackToForm, suggestedDates = true }: { readonly destId: string; readonly onClose: () => void; readonly picked?: readonly (PlaceRef & { readonly name: string })[]; readonly values?: TripFormValues; readonly onValues?: (p: Partial<TripFormValues>) => void; readonly onBackToForm?: () => void; readonly suggestedDates?: boolean }) {
  const { state } = useTrips();
  const { busy, create } = useCreateTripFlow(onClose);
  const requireIdentity = useRequireIdentity();
  const { state: destState } = useDestination(destId);
  const dest = destState.status === 'ready' ? destState.data : null;
  const [suggested, setSuggested] = useState(suggestedDates);
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(() => ({ ...initialDraft(), ...values }));
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const set = (p: Partial<Draft>): void => {
    if ('start' in p || 'end' in p || 'tentative' in p) setSuggested(false);
    setD((cur) => ({ ...cur, ...p }));
    onValues?.(p);
  };
  const name: WizardStep = WIZARD_STEPS[step] ?? 'where';
  const last = step === WIZARD_STEPS.length - 1;
  const defaultName = uniqueName(state.trips, dest?.name ?? '');

  const go = (to: number): void => {
    setStep(to);
    setError('');
    window.setTimeout(() => headingRef.current?.focus(), 0);
  };
  const next = (): void => {
    const err = stepError(name, d);
    if (err) return setError(err);
    if (!last) return go(step + 1);
    const tripName = parseTripName(d.name.trim() || defaultName);
    const dates = parseDates({ start: d.start, end: d.end, tentative: d.tentative, days: d.days });
    const bud = parseMoneyField(d.budget, T.create.budget);
    if (!tripName.ok) return setError(tripName.error);
    if (!dates.ok) return setError(dates.error);
    if (!bud.ok) return setError(bud.error);
    requireIdentity(() => create({ name: tripName.value, destinationId: destId, ...dates.value, kind: d.kind, interests: d.interests, styles: values?.styles, pace: values?.pace, budgetK: bud.value }, picked));
  };

  const label = T.wizard.steps[name];
  return (
    <Sheet label={label} onClose={onClose}>
      <TripFormLayout actions={<TripFormActions label={last ? T.wizard.create : T.wizard.next} busy={busy} onSubmit={next} onClose={onClose} onBack={step > 0 ? () => go(step - 1) : onBackToForm} />}>
        <div>
          <div className="obar" role="progressbar" aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={step + 1} aria-label={fill(T.wizard.progress, { n: step + 1, total: WIZARD_STEPS.length })}>
            <i style={{ width: `${Math.round(((step + 1) / WIZARD_STEPS.length) * PERCENT)}%` }} />
          </div>
          <p className="note spaced">{fill(T.wizard.stepOf, { n: step + 1, total: WIZARD_STEPS.length })}</p>
          <h2 ref={headingRef} tabIndex={-1}>{label}</h2>
        </div>
        {(name === 'when' && suggested) ? <p className="note">{T.create.suggestedDates}</p> : null}
        {picked.length ? <p className="note">{fill(T.create.pickedSummary, { names: picked.map((p) => p.name).join(', ') })}</p> : null}
        {last ? <p className="note">{T.create.reviewDates}</p> : null}
        <StepBody step={name} d={d} set={set} dest={dest} defaultName={defaultName} />
        {error ? <WarnBox>{error}</WarnBox> : null}
      </TripFormLayout>
    </Sheet>
  );
}
