import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { groupCosts } from '../model/costView.ts';
import type { CostGrouping } from '../model/costView.ts';
import { ITEM_KINDS, KIND_ORDER } from '../model/trip.const.ts';
import type { ItemKind, TripItem } from '../model/trip.types.ts';
import { isPlain, summarizeCosts } from '../model/tripMath.ts';
import { itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { dayCostText } from './CostBox.tsx';
import { money } from './ItemMeta.tsx';

/** One cost row: the name, the kind, the price (or 'Price unknown'/'Included'); tapping opens the item editor. */
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

/** The cost detail sheet: switch By day / By kind, the groups collapsed by default, tap a cost to edit. It has a separate booking row. */
export function CostDetailSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, days } = useTripView();
  const [by, setBy] = useState<CostGrouping>('day');
  const cs = summarizeCosts(trip);
  const groups = groupCosts(trip.items, by, days);
  /** The group label: 'Day n', 'No date yet' or the kind name. */
  const label = (key: string): string => {
    if (by === 'kind') return ITEM_KINDS[key as ItemKind].label;
    return key ? fill(T.view.day, { n: days.indexOf(key) + 1 }) : T.view.unassigned;
  };
  return (
    <Sheet label={T.cost.detailTitle} onClose={onClose}>
      <div className="pp">
        <h2>{T.cost.detailTitle}</h2>
        <div className="chips" role="group" aria-label={T.cost.groupBy}>
          <ChipToggle pressed={by === 'day'} onClick={() => setBy('day')}>{T.cost.byDayTab}</ChipToggle>
          <ChipToggle pressed={by === 'kind'} onClick={() => setBy('kind')}>{T.cost.byKindTab}</ChipToggle>
        </div>
        <div className="trip-cost-groups">
          {groups.map((g) => (
            <details key={g.key}>
              <summary><Icon name="chevron-down" size="s" />{by === 'day' ? dayCostText(label(g.key), g) : `${label(g.key)} — ${g.knownCount ? money(g.knownK) : T.cost.notKnown}`}<span>{g.items.length}</span></summary>
              {g.items.map((item) => <CostRow key={item.id} item={item} />)}
            </details>
          ))}
        </div>
        {cs.booked ? <p className="note"><Icon name="ticket" size="s" />{fill(T.cost.booked, { b: cs.booked, n: cs.bookable })}</p> : null}
      </div>
    </Sheet>
  );
}

/** The new cost kinds that can be chosen when adding a cost: kinds that have a price, except sightseeing (sightseeing places are added from Discover). */
const NEW_COST_KINDS = KIND_ORDER.filter((k) => !isPlain(k) && k !== 'sightseeing');

/** The 'Add a cost' sheet: either create a new cost (choosing the kind clearly), or enter a price for an existing item so no duplicate item is created. */
export function CostAddSheet({ onClose }: { readonly onClose: () => void }) {
  const { trip, setOverlay } = useTripView();
  const [mode, setMode] = useState<'new' | 'existing' | null>(null);
  const missing = trip.items.filter((i) => !isPlain(i.type) && !i.included && i.costK === null);
  return (
    <Sheet label={T.cost.add} onClose={onClose}>
      <div className="pp">
        <h2>{T.cost.add}</h2>
        <div className="chips" role="group" aria-label={T.cost.addPick}>
          <ChipToggle pressed={mode === 'existing'} icon="coin" onClick={() => setMode('existing')}>{fill(T.cost.addExisting, { n: missing.length })}</ChipToggle>
          <ChipToggle pressed={mode === 'new'} icon="plus" onClick={() => setMode('new')}>{T.cost.addNew}</ChipToggle>
        </div>
        {mode === 'existing' ? (
          missing.length ? <div className="trip-cost-groups">{missing.map((i) => <CostRow key={i.id} item={i} />)}</div> : <p className="note">{T.cost.addExistingNone}</p>
        ) : null}
        {mode === 'new' ? (
          <>
            <p className="note">{T.cost.addNewNote}</p>
            <div className="chips" role="group" aria-label={T.cost.addKind}>
              {NEW_COST_KINDS.map((k) => <Button key={k} kind="ghost" icon={ITEM_KINDS[k].icon} onClick={() => setOverlay({ kind: 'editor', itemId: null, preset: k })}>{ITEM_KINDS[k].label}</Button>)}
            </div>
          </>
        ) : null}
        {mode === null ? <p className="note">{T.cost.addHint}</p> : null}
      </div>
    </Sheet>
  );
}
