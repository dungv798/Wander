import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { travelEstimate } from '../../../shared/lib/geo.ts';
import { safeHttpUrl } from '../../../shared/lib/safeUrl.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Chip } from '../../../shared/ui/Chip.tsx';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { useFire } from '../hooks/useFire.ts';
import { useTrips } from '../hooks/TripsProvider.tsx';
import type { Trip, TripItem } from '../model/trip.types.ts';
import { canCompleteItem, isPlaceItem } from '../model/itemCompletion.ts';
import { coordOf, itemName } from '../model/tripView.ts';
import type { TripCatalog } from '../model/tripView.ts';
import { TODAY_COPY as C } from './today.copy.ts';

interface ItemProps {
  readonly trip: Trip;
  readonly item: TripItem;
  readonly cat: TripCatalog;
  readonly onCompleted?: () => void;
}

/** Keeps the external directions link like the old screen; with no coordinates it gives no guessed link. */
export function MapLink({ item, cat }: Pick<ItemProps, 'item' | 'cat'>) {
  const place = cat.place(item.placeId);
  if (!place || place.lat === null || place.lon === null) return null;
  return <a className="btn ghost glass-control maplink" href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" rel="noopener noreferrer" aria-label={fill(C.mapAria, { name: itemName(item, cat) })}><Icon name="map-pin" size="s" />{C.map}</a>;
}

/** Records the caller's own mark and then re-reads the trip; it locks the button while sending and keeps the data if there is an error. */
function DoneButton({ trip, item, cat, onCompleted }: ItemProps) {
  const { actions } = useTrips();
  const fire = useFire();
  const [busy, setBusy] = useState(false);
  const place = isPlaceItem(item);
  const label = place ? (item.done ? C.unmarkVisited : C.markVisited) : C.toggle;
  /** Waits for the actions to re-read the server state before opening the done list. */
  const toggle = (): void => {
    setBusy(true);
    fire(actions.toggleDone(trip.id, item.id).then(() => { if (!item.done) onCompleted?.(); }).finally(() => setBusy(false)));
  };
  if (!canCompleteItem(item)) return null;
  return <div className="stack tight">
    <Button kind="ghost" icon="check" disabled={busy} aria-pressed={item.done} aria-label={fill(label, { name: itemName(item, cat) })} onClick={toggle}>{place ? C.visitedButton : C.done}</Button>
    {trip.memberCount > 1 ? <small className="note">{fill(place ? C.visitedPeople : C.taskPeople, { n: item.doneBy.length, m: trip.memberCount })}</small> : null}
  </div>;
}

/** The highlighted card uses a catalog photo with attribution; the distance is computed only from the item right before when both coordinates exist. */
export function NextCard({ trip, item, cat, previous, onCompleted }: ItemProps & { readonly previous: TripItem | null }) {
  const place = cat.place(item.placeId);
  const photo = place?.photos[0];
  const coord = coordOf(cat);
  const from = previous?.placeId ? coord(previous.placeId) : null;
  const to = item.placeId ? coord(item.placeId) : null;
  return <section className="today-next panel todayrow">
    {photo ? <figure><RevealImage src={photo.url} alt={place?.name ?? ''} /><figcaption><a href={safeHttpUrl(photo.sourceUrl)} target="_blank" rel="noopener noreferrer">{fill(C.photo, { author: photo.author, license: photo.license })}</a></figcaption></figure> : null}
    <div className="today-next-body">
      <Chip tone="sun" icon={isPlaceItem(item) ? 'map-pin' : 'check'}>{isPlaceItem(item) ? C.next : C.nextTask}</Chip>
      <span className="tdtime">{item.timeOfDay ?? C.noTime}</span>
      <h3>{itemName(item, cat)}</h3>
      {previous && from && to ? <p className="note">{fill(C.distance, { km: travelEstimate(from, to).km, name: itemName(previous, cat) })}</p> : null}
      <div className="today-actions"><MapLink item={item} cat={cat} /><DoneButton trip={trip} item={item} cat={cat} onCompleted={onCompleted} /></div>
    </div>
  </section>;
}

/** A compact row keeping the real time, the map and the tick/untick action of a task or a place for the user themself. */
export function TodayItem({ trip, item, cat, onCompleted }: ItemProps) {
  return <li className={`todayrow ${item.done ? 'done' : ''}`}>
    <span className="tdtime">{item.timeOfDay ?? C.noTime}</span>
    <span className="tdbody"><b>{itemName(item, cat)}</b><MapLink item={item} cat={cat} /></span>
    <DoneButton trip={trip} item={item} cat={cat} onCompleted={onCompleted} />
  </li>;
}
