import { fill } from '../../../shared/const/copy.vi.ts';
import type { ReactNode } from 'react';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { TripDay, TripItem } from '../model/onboarding.types.ts';
import { dayPlaces } from '../model/sampleTrip.ts';

interface RowProps {
  readonly item: TripItem;
  readonly hot: boolean;
  readonly shown: boolean;
}

/** One row of the day: a photo + a number (matching the pin number), the part of day, the name and a short note; the lunch-break row has no number. */
function TripRow({ item, hot, shown }: RowProps) {
  const cls = ['ob-row', item.kind === 'break' ? 'ob-brk' : '', hot ? 'hot' : '', shown ? 'shown' : ''].filter(Boolean).join(' ');
  if (item.kind === 'break') {
    return (
      <li className={cls}>
        <span className="ob-th ob-brk">
          <Icon name="tools-kitchen-2" />
        </span>
        <span className="ob-tx">
          <small>{T.trip.slots[item.slot]}</small>
          <strong>{T.trip.lunch.title}</strong>
          <em>{T.trip.lunch.note}</em>
        </span>
      </li>
    );
  }
  const note = item.proposedBy ? fill(T.share.acceptedBy, { name: item.proposedBy }) : T.trip.notes[item.note as keyof typeof T.trip.notes];
  return (
    <li className={cls}>
      <span className="ob-th" style={{ backgroundImage: `url(${onboardPhotoUrl(item.place)})` }}>
        <b>{item.num}</b>
      </span>
      <span className="ob-tx">
        <small>{T.trip.slots[item.slot]}</small>
        <strong>{item.place.name}</strong>
        {item.proposedBy ? <span className="ob-by">{note}</span> : <em>{note}</em>}
      </span>
    </li>
  );
}

interface DaySheetProps {
  readonly accessory?: ReactNode;
  readonly days: readonly TripDay[];
  /** 0 = overview, 1.. = the day number. */
  readonly tab: number;
  /** The number of rows already shown of the day being viewed (Infinity = all). */
  readonly rowsShown: number;
  readonly hot: number;
  readonly onTab: (tab: number) => void;
}

/** The two-day overview: one row per day with the photos of the places. */
function Overview({ days }: { readonly days: readonly TripDay[] }) {
  return (
    <ul className="ob-rows">
      {days.map((d) => (
        <li key={d.index} className="ob-row ob-sum shown">
          <span className={`ob-dot d${d.index}`} />
          <span className="ob-tx">
            <strong>{fill(T.trip.day, { n: d.index + 1 })}</strong>
            <em>{T.trip.themes[d.theme as keyof typeof T.trip.themes]}</em>
          </span>
          <span className="ob-faces">
            {dayPlaces(d).map((p) => (
              <i key={p.id} style={{ backgroundImage: `url(${onboardPhotoUrl(p)})` }} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The itinerary sheet under the map: Overview / Day 1 / Day 2 tabs, a title (with the 'Illustrative itinerary' label) and a list synchronized with the pins. */
export function DaySheet({ days, tab, rowsShown, hot, onTab, accessory }: DaySheetProps) {
  const day = tab > 0 ? days[tab - 1] : undefined;
  return (
    <section className="ob-sheet">
      <div className="ob-grab" />
      <div className="ob-tabs" role="tablist">
        {[T.trip.overview, ...days.map((d) => fill(T.trip.day, { n: d.index + 1 }))].map((name, i) => (
          <button key={name} type="button" role="tab" aria-selected={i === tab} className={i === tab ? 'on' : undefined} onClick={() => onTab(i)}>
            {name}
          </button>
        ))}
      </div>
      <div className="ob-dayhead">
        <span className="h">
          {day ? fill(T.trip.day, { n: day.index + 1 }) : T.trip.name}
          {day ? <small>{T.trip.themes[day.theme as keyof typeof T.trip.themes]}</small> : null}
        </span>
        {accessory ?? <span className="ob-badge">{day ? T.trip.sampleTimes : T.trip.sample}</span>}
      </div>
      {day ? (
        <ul className={`ob-rows${hot >= 0 ? ' focus' : ''}`}>
          {day.items.map((item, i) => (
            <TripRow key={item.kind === 'stop' ? item.place.id : 'lunch'} item={item} hot={hot === i} shown={i < rowsShown} />
          ))}
        </ul>
      ) : (
        <Overview days={days} />
      )}
    </section>
  );
}
