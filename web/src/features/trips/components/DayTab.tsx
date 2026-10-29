import { Fragment } from 'react';
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
