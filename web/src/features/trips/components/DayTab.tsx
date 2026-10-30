import { Fragment, useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { formatTravelTime, minutesForKm, roadKmBetween } from '../../../shared/lib/geo.ts';
import { dayLabel } from '../../../shared/lib/dates.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { ChipToggle } from '../../../shared/ui/Controls.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { costSummaryText, dayItems, roadKm, summarizeCosts, unassignedItems } from '../model/tripMath.ts';
import { coordOf } from '../model/tripView.ts';
import { permissionsOf } from '../model/tripPermissions.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import { ItemRow } from './ItemRow.tsx';
import { mealGapEditor, mealGaps, mealGapStorageKey, readMealGapDismissals, saveMealGapDismissals } from '../model/mealGaps.ts';
import type { MealGap } from '../model/mealGaps.ts';
import { AddManyEntry } from './AddManyEntry.tsx';
import { MEAL_GAPS_COPY as M } from '../model/mealGaps.copy.ts';

/** Nhắc bỏ qua được theo chuyến/ngày; chỉ mở editor, không tạo mục trước xác nhận. */
function MealReminders({ day }: { readonly day: string }) {
  const { trip, cat, setOverlay } = useTripView();
  const key = mealGapStorageKey(trip.id, day);
  const [dismissed, setDismissed] = useState(() => readMealGapDismissals(key));
  if (!permissionsOf(trip).schedule) return null;
  const gaps = mealGaps(trip.items, day, cat.place, dismissed);
  /** Đóng ngay và nhớ lựa chọn nếu localStorage khả dụng. */
  const dismiss = (gap: MealGap): void => {
    const next = [...dismissed, gap];
    setDismissed(next);
    saveMealGapDismissals(key, next);
  };
  return gaps.map((gap) => (
    <aside className="next" key={gap} aria-label={M[gap].title}>
      <span className="ib"><Icon name={gap === 'rest' ? 'moon-stars' : 'tools-kitchen-2'} size="l" /></span>
      <div>
        <h3>{M[gap].title}</h3>
        <p className="note">{M.note}</p>
        <div className="chips">
          <Button kind="ghost" icon="plus" onClick={() => setOverlay(mealGapEditor(gap, day))}>{M[gap].action}</Button>
          <Button kind="ghost" icon="x" aria-label={M[gap].dismiss} onClick={() => dismiss(gap)}>{M.close}</Button>
        </div>
      </div>
    </aside>
  ));
}

/** Dòng "≈ 1,5 giờ · 25 km · ước tính" giữa hai mục liền nhau có tọa độ. */
function TravelLine({ km }: { readonly km: number }) {
  return (
    <div className="travel">
      <Icon name="motorbike" size="s" />
      <span>{fill(T.view.travel, { time: formatTravelTime(minutesForKm(km)), km: Math.round(km) })}</span>
    </div>
  );
}

/** Tab một ngày: tiêu đề (thứ, quãng đường, chi phí), nút sắp xếp, các mục kèm dòng di chuyển, nút thêm. */
export function DayTab({ index }: { readonly index: number }) {
  const { trip, cat, days, sorting, setSorting, setOverlay } = useTripView();
  const day = days[index];
  if (!day) return null;
  const coord = coordOf(cat);
  const items = dayItems(trip, day);
  const cs = summarizeCosts({ items });
  const road = roadKm(items, coord);
  const sort = sorting && items.length > 1;
  const hasUnassigned = permissionsOf(trip).schedule && unassignedItems(trip).length > 0;
  return (
    <section className="daysec">
      <div className="dayhead">
        <h2>
          <i />
          {fill(T.view.day, { n: index + 1 })}
        </h2>
        <span className="s">
          {dayLabel(day)}
          {road > 0 ? <><br />{fill(T.view.dayRoad, { time: formatTravelTime(minutesForKm(road)) })}</> : null}
          <br />{costSummaryText(cs)}
        </span>
      </div>
      <AddManyEntry />
      <MealReminders key={`${trip.id}:${day}`} day={day} />
      {items.length > 1 && permissionsOf(trip).schedule ? (
        <div className="dayact">
          <ChipToggle pressed={sort} icon="arrow-up" onClick={() => setSorting(!sorting)}>
            {sort ? T.view.sortDone : T.view.sort}
          </ChipToggle>
        </div>
      ) : null}
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
      {items.length && hasUnassigned ? <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'addToDay' })}>{T.view.addFromUnassigned}</Button> : null}
      <Button kind="ghost" block icon="plus" onClick={() => setOverlay({ kind: 'add' })}>{T.view.addItemToDay}</Button>
    </section>
  );
}
