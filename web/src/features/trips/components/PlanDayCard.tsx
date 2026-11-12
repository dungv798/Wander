import { fill } from '../../../shared/const/copy.vi.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { formatTravelMinutes, roundTravelMinutes } from '../../../shared/lib/geo.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { PlanDayPreview } from '../model/planDays.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { PlanItemRow } from './PlanItemRow.tsx';

interface PlanDayCardProps { readonly day: PlanDayPreview; readonly number: number; readonly busy: boolean; readonly onDay: (id: string, day: string) => void }

/** A day card with an old landmark, new places and a route estimate; it does not call the schedule feasible when the duration/time is still missing. */
export function PlanDayCard({ day, number, busy, onDay }: PlanDayCardProps) {
  return <details className="plan-day-card" data-overloaded={day.overloaded} open={day.itemIds.length > 0 || day.empty}>
    <summary className="plan-day-head"><span className="plan-day-number"><Icon name="calendar-event" /></span><div><h3>{fill(T.view.day, { n: number + 1 })}</h3><p>{dayLabel(day.day)}{!day.itemIds.length && day.existingIds.length ? ` · ${fill(T.plan.keptCount, { n: day.existingIds.length })}` : ''}</p></div>{day.overloaded ? <span className="plan-day-alert"><Icon name="alert-triangle" size="s" /></span> : null}<span className="plan-day-count">{day.existingIds.length + day.itemIds.length}</span><Icon name="chevron-left" size="s" /></summary>
    {day.empty ? <p className="plan-day-empty"><Icon name="plus" />{T.plan.dayEmpty}</p> : <>
      <div className="plan-day-stats">
        {day.totalKnownMinutes ? <span><Icon name="clock" size="s" />{fill(T.plan.visits, { time: formatTravelMinutes(roundTravelMinutes(day.totalKnownMinutes)) })}</span> : null}
        {day.travelMinutes > 0 ? <span><Icon name="route" size="s" />{fill(T.plan.travel, { time: formatTravelMinutes(roundTravelMinutes(day.travelMinutes)) })}</span> : null}
      </div>
      <meter aria-label={T.plan.density} min={0} max={day.capacityMinutes} value={Math.min(day.loadMinutes, day.capacityMinutes)} />
      <ol className="plan-stop-list">
        {day.existingIds.map((id, index) => <PlanItemRow key={id} itemId={id} index={index} existing disabled onDay={onDay} />)}
        {day.itemIds.map((id, index) => <PlanItemRow key={id} itemId={id} day={day.day} index={day.existingIds.length + index} disabled={busy} onDay={onDay} />)}
      </ol>
      <div className="plan-day-notes">
        {day.overloaded ? <p><Icon name="alert-triangle" size="s" />{T.plan.dayOverloaded}</p> : null}
        {day.totalUnknownCount ? <p><Icon name="info-circle" size="s" />{fill(T.plan.missing, { n: day.totalUnknownCount })}</p> : null}
        {day.unknownTravelCount ? <p><Icon name="route" size="s" />{T.plan.missingTravel}</p> : null}
        {day.timedCount ? <p><Icon name="clock" size="s" />{T.plan.timeCheck}</p> : null}
      </div>
    </>}
  </details>;
}
