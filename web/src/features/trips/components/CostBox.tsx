import { fill } from '../../../shared/const/copy.vi.ts';
import { FORMAT } from '../../../shared/const/format.const.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Progress } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { groupCosts } from '../model/costView.ts';
import type { CostGroup } from '../model/costView.ts';
import { budgetStatus, summarizeCosts } from '../model/tripMath.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';

/** The maximum number of day rows on the compact card; the rest are viewed in the detail sheet. */
const CARD_DAY_ROWS = 2;

/** The line 'Day 1 - 120,000 VND + 4 items with an unknown price' of a day group; when no price exists yet it says so plainly, not showing 0. */
export function dayCostText(label: string, g: CostGroup): string {
  if (!g.knownCount) return fill(T.cost.dayNone, { day: label, n: g.unknownCount + g.includedCount });
  const base = fill(T.cost.dayKnown, { day: label, money: money(g.knownK) });
  return g.unknownCount ? base + fill(T.cost.dayUnknown, { n: g.unknownCount }) : base;
}

/** The compact cost card: the amount recorded, the progress of entering prices, the budget (if any), a few day rows and the entry to the detail. The detail of each cost is in its own sheet. */
export function CostBox({ allDays = false }: { readonly allDays?: boolean }) {
  const { trip, days, setOverlay } = useTripView();
  const cs = summarizeCosts(trip);
  const bud = cs.knownCount ? budgetStatus(trip.budgetK, cs.totalK) : null;
  const pricedTotal = cs.bookable - cs.includedCount;
  const dayGroups = groupCosts(trip.items, 'day', days).filter((g) => g.key);
  // The overview shows only the first few days; the Cost mode (`allDays`) shows every day.
  const shown = allDays ? dayGroups : dayGroups.slice(0, CARD_DAY_ROWS);
  const empty = !cs.bookable;
  const progress = fill(T.cost.progress, { n: cs.knownCount, m: pricedTotal });
  return (
    <section className="daysec costbox trip-cost" aria-label={T.cost.title}>
      <div className="dayhead"><h2><Icon name="coin" />{T.cost.title}</h2></div>
      <div className="bigmoney"><b>{cs.knownCount ? <>{money(cs.totalK).replace(FORMAT.CURRENCY_SYMBOL, '')}<span className="trip-money-currency">{FORMAT.CURRENCY_SYMBOL}</span></> : T.cost.notKnown}</b><span>{T.cost.recorded}</span></div>
      {empty ? (
        <div className="trip-cost-empty"><Icon name="coin" size="l" /><p>{T.cost.empty}</p></div>
      ) : (
        <>
          <p className="note">{cs.unknownCount ? fill(T.cost.cardProgress, { n: cs.knownCount, m: pricedTotal, u: cs.unknownCount }) : progress}</p>
          <Progress label={progress} value={cs.knownCount} max={pricedTotal} />
          {cs.includedCount ? <p className="note"><Icon name="check" size="s" />{fill(T.cost.included, { n: cs.includedCount })}</p> : null}
          {bud ? <p className={bud.over ? 'overnote' : 'note'}>{bud.over ? fill(T.cost.over, { money: money(-bud.leftK) }) : fill(T.cost.left, { budget: money(bud.budgetK), left: money(bud.leftK) })}{cs.unknownCount ? T.cost.leftUnknown : ''}</p> : null}
          {shown.length ? (
            <ul className="cost-days" aria-label={T.cost.byDay}>
              {shown.map((g) => <li key={g.key}>{dayCostText(fill(T.view.day, { n: days.indexOf(g.key) + 1 }), g)}</li>)}
            </ul>
          ) : null}
        </>
      )}
      <div className="two">
        {!empty ? <Button kind="ghost" icon="list-check" onClick={() => setOverlay({ kind: 'costDetail' })}>{T.cost.detail}</Button> : null}
        {permissionsOf(trip).schedule ? <Button kind="ghost" icon="plus" onClick={() => setOverlay({ kind: 'costAdd' })}>{T.cost.addShort}</Button> : null}
      </div>
    </section>
  );
}
