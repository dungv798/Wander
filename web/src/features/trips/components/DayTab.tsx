import { Fragment, lazy, Suspense, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { formatTravelDistance, formatTravelMinutes, formatTravelTime, minutesForKm, roadKmBetween } from '../../../shared/lib/geo.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { costSummaryText, dayItems, roadKm, roadMinutes, summarizeCosts, unassignedItems } from '../model/tripMath.ts';
import { coordOf } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { ItemRow } from './ItemRow.tsx';
import { mealGaps, mealGapStorageKey, readMealGapDismissals, saveMealGapDismissals } from '../model/mealGaps.ts';
import type { MealGap } from '../model/mealGaps.ts';
import { AddManyEntry } from './AddManyEntry.tsx';
import { MEAL_GAPS_COPY as M } from '../model/mealGaps.copy.ts';

const MealSuggestEntry = lazy(() => import('./MealSuggestEntry.tsx').then(module => ({ default: module.MealSuggestEntry })));

/** A reminder that can be skipped per trip/day; it only opens the editor, no item is created before confirmation. */
function MealReminders({ day }: { readonly day: string }) {
  const { trip, cat } = useTripView();
  const key = mealGapStorageKey(trip.id, day);
  const [dismissed, setDismissed] = useState(() => readMealGapDismissals(key));
  const [expanded, setExpanded] = useState<MealGap | null>(null);
  if (!permissionsOf(trip).schedule) return null;
  const gaps = mealGaps(trip.items, day, cat.place, dismissed);
  /** Closes at once and remembers the choice if localStorage is available. */
  const dismiss = (gap: MealGap): void => {
    const next = [...dismissed, gap];
    setDismissed(next);
    saveMealGapDismissals(key, next);
  };
  const gap = gaps[0];
  if (!gap) return null;
  return (
    <aside className="next meal-nudge" aria-label={M[gap].title}>
      <span className="ib"><Icon name={gap === 'rest' ? 'moon-stars' : 'tools-kitchen-2'} size="l" /></span>
      <div>
        <h3>{M[gap].title}</h3>
        <p className="note">{M[gap].reason} {M.note}</p>
        <div className="chips">
          {expanded === gap ? <Suspense fallback={null}><MealSuggestEntry day={day} gap={gap} /></Suspense> : <Button kind="ghost" icon="plus" onClick={() => setExpanded(gap)}>{M[gap].action}</Button>}
          <Button kind="ghost" icon="x" aria-label={M[gap].dismiss} onClick={() => dismiss(gap)}>{M.close}</Button>
        </div>
      </div>
    </aside>
  );
}

const MEAL_CHOICES: readonly MealGap[] = ['lunch', 'dinner', 'rest'];

/** The 'Add food / rest' entry is always present on EVERY day (independent of the reminder threshold): choose lunch, dinner or rest and then open the suggestions/hand entry. */
function MealAddRow({ day }: { readonly day: string }) {
  const { trip } = useTripView();
  const [open, setOpen] = useState(false);
  const [gap, setGap] = useState<MealGap | null>(null);
  if (!permissionsOf(trip).schedule) return null;
  return (
    <div className="meal-add">
      <Button kind="ghost" block icon="tools-kitchen-2" aria-expanded={open} onClick={() => { setOpen(!open); setGap(null); }}>{M.addEntry}</Button>
      {open ? (
        <div className="chips" role="group" aria-label={M.addLabel}>
          {MEAL_CHOICES.map((g) => <ChipToggle key={g} pressed={gap === g} icon={g === 'rest' ? 'moon-stars' : 'tools-kitchen-2'} onClick={() => setGap(g)}>{M[g].short}</ChipToggle>)}
        </div>
      ) : null}
      {open && gap ? <div className="chips"><Suspense fallback={null}><MealSuggestEntry day={day} gap={gap} /></Suspense></div> : null}
    </div>
  );
}

/** The line 'about 1.5 hours - 25 km - estimate' between two adjacent items that have coordinates. */
function TravelLine({ km }: { readonly km: number }) {
  return (
    <div className="travel">
      <Icon name="motorbike" size="s" />
      <span>{fill(T.view.travel, { time: formatTravelTime(minutesForKm(km)), distance: formatTravelDistance(km) })}</span>
    </div>
  );
}

/** The tab of one day: the title (weekday, distance, cost), the reorder button, the items with travel lines, the add button. */
export function DayTab({ index }: { readonly index: number }) {
  const { trip, cat, days, sorting, setSorting, setOverlay } = useTripView();
  const day = days[index];
  if (!day) return null;
  const coord = coordOf(cat);
  const items = dayItems(trip, day);
  const cs = summarizeCosts({ items });
  const road = roadKm(items, coord);
  const roadMin = roadMinutes(items, coord);
  const sort = sorting && items.length > 1;
  const hasUnassigned = permissionsOf(trip).schedule && unassignedItems(trip).length > 0;
  return (
    <section className="daysec">
      <div className="dayhead">
        <div className="day-title-row">
        <h2>
          <i />
          {fill(T.view.day, { n: index + 1 })}
        </h2>
        {items.length > 1 && permissionsOf(trip).schedule ? <ChipToggle pressed={sort} icon="arrow-up" onClick={() => setSorting(!sorting)}>{sort ? T.view.sortDone : T.view.sort}</ChipToggle> : null}
        </div>
        <span className="s">
          {dayLabel(day)}
          {road > 0 ? <> · {fill(T.view.dayRoad, { time: formatTravelMinutes(roadMin) })}</> : null}
          {' · '}{costSummaryText(cs)}
        </span>
      </div>
      {!items.length ? (
        <div className="emptyday">
          {T.view.emptyDay}
          {hasUnassigned ? <Button kind="ghost" icon="plus" onClick={() => setOverlay({ kind: 'addToDay' })}>{T.view.addFromUnassigned}</Button> : null}
        </div>
      ) : null}
      {items.map((item, k) => {
        const next = items[k + 1];
        const a = item.placeId ? coord(item.placeId) : null;
        const b = next?.placeId ? coord(next.placeId) : null;
        return (
          <Fragment key={item.id}>
            <ItemRow item={item} num={k + 1} sort={sort ? { first: k === 0, last: k === items.length - 1 } : undefined} />
            {a && b ? <TravelLine km={roadKmBetween(a, b)} /> : null}
          </Fragment>
        );
      })}
      <div className="day-tools"><AddManyEntry /></div>
      <MealReminders key={`${trip.id}:${day}`} day={day} />
      {items.length && hasUnassigned ? <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'addToDay' })}>{T.view.addFromUnassigned}</Button> : null}
      <MealAddRow day={day} />
      <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'add' })}>{T.view.addItemToDay}</Button>
    </section>
  );
}
