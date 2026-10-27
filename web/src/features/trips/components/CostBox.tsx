import { fill } from '../../../shared/const/copy.vi.ts';
import { Progress } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { ITEM_KINDS, KIND_ORDER } from '../model/trip.const.ts';
import { budgetStatus, summarizeCosts } from '../model/tripMath.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';

/** Khối "Chi phí": tổng phải trả thêm, số mục chưa biết giá / đã bao gồm, thanh ngân sách (nếu có), tổng theo loại, số mục đã đặt chỗ. */
export function CostBox() {
  const { trip } = useTripView();
  const cs = summarizeCosts(trip);
  const bud = budgetStatus(trip.budgetK, cs.totalK);
  const kinds = KIND_ORDER.filter((k) => (cs.byKind[k] ?? 0) > 0);
  return (
    <section className="daysec costbox">
      <div className="dayhead">
        <h2>{T.cost.title}</h2>
        <span className="s">{T.cost.sub}</span>
      </div>
      <div className="bigmoney">
        <b>{money(cs.totalK)}</b>
        <span>{T.cost.total}</span>
      </div>
      {cs.unknownCount ? (
        <p className="note">
          <Icon name="coin" size="s" /> {fill(T.cost.unknown, { n: cs.unknownCount })}
        </p>
      ) : null}
      {cs.includedCount ? (
        <p className="note">
          <Icon name="check" size="s" /> {fill(T.cost.included, { n: cs.includedCount })}
        </p>
      ) : null}
      {bud ? (
        <>
          <Progress label={T.cost.budgetUsed} value={bud.pct} max={100} over={bud.over} />
          <p className={bud.over ? 'overnote' : 'note'}>
            {bud.over ? <Icon name="alert-triangle" size="s" /> : null}
            {bud.over ? ` ${fill(T.cost.over, { money: money(-bud.leftK) })}` : fill(T.cost.left, { budget: money(bud.budgetK), left: money(bud.leftK) })}
            {cs.unknownCount ? T.cost.leftUnknown : ''}
          </p>
        </>
      ) : null}
      {kinds.length ? (
        <div className="chips">
          {kinds.map((k) => (
            <span key={k} className={`chip tint ${ITEM_KINDS[k].cat}`}>
              {`${ITEM_KINDS[k].label}: ${money(cs.byKind[k] ?? 0)}`}
            </span>
          ))}
        </div>
      ) : null}
      {cs.bookable ? (
        <p className="note">
          <Icon name="ticket" size="s" /> {fill(T.cost.booked, { b: cs.booked, n: cs.bookable })}
        </p>
      ) : null}
    </section>
  );
}
