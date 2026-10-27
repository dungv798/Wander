import { useRef, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { LIMITS } from '../../../shared/const/limits.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { addDays, dayMonth, fullDate, nextWeekday, todayLocal } from '../../../shared/lib/dates.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle, CheckRow, WarnBox } from '../../../shared/ui/Controls.tsx';
import { Field } from '../../../shared/ui/Field.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { useRequireIdentity } from '../../identity/index.ts';
import { CATEGORY_ICON, COMING_SOON, useDestination } from '../../discover/index.ts';
import type { DestinationDetail } from '../../discover/index.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import { DEFAULT_START_WEEKDAY, DEFAULT_TRIP_DAYS, TRIP_KINDS, WIZARD_STEPS } from '../model/trip.const.ts';
import type { WizardStep } from '../model/trip.const.ts';
import { parseDates, parseMoneyField, parseTripName } from '../model/tripForms.ts';
import { uniqueName } from '../model/tripState.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
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
            <ChipToggle key={k} pressed={d.kind === k} onClick={() => set({ kind: d.kind === k ? null : k })}>{k}</ChipToggle>
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
        <li><b>{T.wizard.summaryDates}</b> {d.tentative ? fill(T.wizard.tentativeSummary, { n: d.days, start: dayMonth(d.start) }) : `${dayMonth(d.start)} – ${dayMonth(d.end)}`}</li>
        <li><b>{T.wizard.summaryKind}</b> {d.kind ?? T.wizard.notChosen}</li>
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
export function TripWizard({ destId, onClose }: { readonly destId: string; readonly onClose: () => void }) {
  const { state, actions } = useTrips();
  const toast = useToast();
  const requireIdentity = useRequireIdentity();
  const { state: destState } = useDestination(destId);
  const dest = destState.status === 'ready' ? destState.data : null;
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(initialDraft);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const set = (p: Partial<Draft>): void => setD((cur) => ({ ...cur, ...p }));
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
    requireIdentity(() => {
      const trip = actions.create({ name: tripName.value, destinationId: destId, ...dates.value, kind: d.kind, interests: d.interests, budgetK: bud.value }, []);
      onClose();
      navigate(VIEW.TRIP, trip.id, 'ov');
      toast.show(fill(T.create.saved, { name: trip.name }));
    });
  };

  const label = T.wizard.steps[name];
  return (
    <Sheet label={label} onClose={onClose}>
      <div className="pp">
        <div>
          <div className="obar" role="progressbar" aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={step + 1} aria-label={fill(T.wizard.progress, { n: step + 1, total: WIZARD_STEPS.length })}>
            <i style={{ width: `${Math.round(((step + 1) / WIZARD_STEPS.length) * PERCENT)}%` }} />
          </div>
          <p className="note spaced">{fill(T.wizard.stepOf, { n: step + 1, total: WIZARD_STEPS.length })}</p>
          <h2 ref={headingRef} tabIndex={-1}>{label}</h2>
        </div>
        <StepBody step={name} d={d} set={set} dest={dest} defaultName={defaultName} />
        {error ? <WarnBox>{error}</WarnBox> : null}
        <div className="stack">
          <Button block onClick={next}>{last ? T.wizard.create : T.wizard.next}</Button>
          {step > 0 ? <Button kind="ghost" block onClick={() => go(step - 1)}>{T.wizard.back}</Button> : null}
          <Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>
        </div>
      </div>
    </Sheet>
  );
}
