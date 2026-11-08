import { TRIP_IMAGES } from '../model/tripImages.const.ts';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../shared/ui/IconButton.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useAutoPlan } from '../hooks/useAutoPlan.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { PlanDayCard } from './PlanDayCard.tsx';
import { PlanItemRow } from './PlanItemRow.tsx';
import './autoPlan.css';

/** Preview dùng cùng ngôn ngữ kính/ảnh của lịch; mọi thay đổi còn là bản nháp đến khi server xác nhận Áp dụng. */
export function AutoPlanSheet({ onClose }: { readonly onClose: () => void }) {
  const model = useAutoPlan(onClose);
  const { trip, cat, requests, busy, plannedCount, deferred, summaries, chooseDay, apply } = model;
  const ready = requests.data !== null && !requests.error;
  const canApply = ready && !busy && plannedCount > 0 && permissionsOf(trip).schedule;
  const close = (): void => { if (!busy) onClose(); };
  return <Sheet label={T.plan.title} onClose={close}>
    <div className="plan-preview">
      <header className="plan-preview-head">
        <div><p className="plan-eyebrow">{T.plan.draft}</p><h2>{T.plan.title}</h2><p className="plan-trip-name">{trip.name}</p></div>
        <IconButton icon="x" label={COPY.common.close} onClick={close} disabled={busy} />
      </header>
      <div className="plan-preview-body">
        <div className="plan-preview-intro">
          {cat.dest.coverUrl ? <img loading="lazy" decoding="async" width={TRIP_IMAGES.PLAN.width} height={TRIP_IMAGES.PLAN.height} src={cat.dest.coverUrl} alt="" /> : null}
          <div><strong>{cat.dest.name}</strong><p><Icon name="check" size="s" />{fill(T.plan.proposed, { n: plannedCount })}</p><p><Icon name="map-pin" size="s" />{fill(T.plan.deferredCount, { n: deferred.length })}</p></div>
        </div>
        <details className="plan-method"><summary><Icon name="route" size="s" />{T.plan.how}</summary><p>{T.plan.assumptions}</p></details>
        {!ready ? <div className="plan-request-status" role={requests.error ? 'alert' : 'status'}><Icon name={requests.error ? 'alert-triangle' : 'clock'} /><p>{requests.error ? T.plan.failed : T.plan.loading}</p>{requests.error ? <Button kind="ghost" onClick={requests.reload}>{COPY.common.retry}</Button> : null}</div> : <>
          <div className="plan-days-grid">{summaries.map((day, number) => <PlanDayCard key={day.day} day={day} number={number} busy={busy} onDay={chooseDay} />)}</div>
          {deferred.length ? <section className="plan-deferred"><header><Icon name="bookmarks" /><div><h3>{T.plan.remainingTitle}</h3><p>{T.plan.remainingNote}</p></div></header><ul className="plan-stop-list">{deferred.map(item => <PlanItemRow key={item.itemId} itemId={item.itemId} reason={item.reason} disabled={busy} onDay={chooseDay} />)}</ul></section> : null}
        </>}
      </div>
      <footer className="plan-preview-actions"><Button kind="ghost" disabled={busy} onClick={close}>{T.plan.skip}</Button><Button icon="check" disabled={!canApply} onClick={apply}>{busy ? T.plan.applying : T.plan.apply}</Button></footer>
    </div>
  </Sheet>;
}
