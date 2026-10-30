import { fill } from '../../../shared/const/copy.vi.ts';
import { Progress } from '../../../shared/ui/Controls.tsx';
import { Button } from '../../../shared/ui/Button.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { ITEM_KINDS } from '../model/trip.const.ts';
import type { TripItem } from '../model/trip.types.ts';
import { budgetStatus, isPlain, summarizeCosts } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { money } from './ItemMeta.tsx';

/** Dòng chi phí co giãn: tên có tooltip, giá đầy đủ, chạm mở thẳng trình sửa mục. */
function CostRow({ item }: { readonly item: TripItem }) {
  const { cat, setOverlay } = useTripView();
  const kind = ITEM_KINDS[item.type];
  const name = itemName(item, cat);
  const amount = item.included ? T.row.included : item.costK === null ? T.row.unknownPrice : money(item.costK);
  return (
    <button type="button" className="trip-cost-row" onClick={() => setOverlay({ kind: 'editor', itemId: item.id, preset: null })}>
      <Icon semantic name={item.type === 'sightseeing' ? 'ticket' : kind.icon} />
      <span className="trip-cost-name"><b title={name}>{name}</b><small>{kind.label}</small></span>
      <span className="trip-cost-amount" title={amount}>{amount}</span>
      <Icon name="pencil" size="s" />
    </button>
  );
}

/** Gom giá theo ngày trong một lượt; loại không có giá không vào tiến độ D18. */
function costGroups(items: readonly TripItem[]): Map<string, TripItem[]> {
  const groups = new Map<string, TripItem[]>();
  for (const item of items) {
    if (isPlain(item.type)) continue;
    const key = item.day ?? '';
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

/** Thẻ chi phí dọc: trống khác 0, đã bao gồm không cộng, nhóm ngày gập được. */
export function CostBox() {
  const { trip, days, setOverlay } = useTripView();
  const cs = summarizeCosts(trip);
  const bud = cs.knownCount ? budgetStatus(trip.budgetK, cs.totalK) : null;
  const progress = fill(T.cost.progress, { n: cs.knownCount, m: cs.bookable - cs.includedCount });
  const groups = costGroups(trip.items);
  const empty = !cs.knownCount && !cs.includedCount;
  return (
    <section className="daysec costbox trip-cost" aria-label={T.cost.title}>
      <div className="dayhead"><h2><Icon name="coin" />{T.cost.title}</h2></div>
      <div className="bigmoney"><b>{cs.knownCount ? money(cs.totalK) : T.cost.notKnown}</b><span>{T.cost.total}</span></div>
      <p className="note">{progress}</p>
      <Progress label={progress} value={cs.knownCount} max={cs.bookable - cs.includedCount} />
      {cs.unknownCount ? <p className="note">{fill(T.cost.unknown, { n: cs.unknownCount })}</p> : null}
      {cs.includedCount ? <p className="note"><Icon name="check" size="s" />{fill(T.cost.included, { n: cs.includedCount })}</p> : null}
      {cs.bookable ? <p className="note"><Icon name="ticket" size="s" />{fill(T.cost.booked, { b: cs.booked, n: cs.bookable })}</p> : null}
      {empty ? <div className="trip-cost-empty"><Icon name="coin" size="l" /><p>{T.cost.empty}</p></div> : null}
      {permissionsOf(trip).schedule ? <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'editor', itemId: null, preset: 'shopping' })}>{T.cost.add}</Button> : null}
      {bud ? <><Progress label={T.cost.budgetUsed} value={bud.pct} max={100} over={bud.over} /><p className={bud.over ? 'overnote' : 'note'}>{bud.over ? fill(T.cost.over, { money: money(-bud.leftK) }) : fill(T.cost.left, { budget: money(bud.budgetK), left: money(bud.leftK) })}{cs.unknownCount ? T.cost.leftUnknown : ''}</p></> : null}
      <div className="trip-cost-groups" aria-label={T.cost.byDay}>
        {[...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([day, items]) => (
          <details key={day} open>
            <summary><Icon name="chevron-down" size="s" />{day ? fill(T.view.day, { n: days.indexOf(day) + 1 }) : T.view.unassigned}<span>{items.length}</span></summary>
            {items.map(item => <CostRow key={item.id} item={item} />)}
          </details>
        ))}
      </div>
    </section>
  );
}
