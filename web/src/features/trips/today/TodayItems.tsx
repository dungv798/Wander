import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { travelEstimate } from '../../../shared/lib/geo.ts';
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

/** Giữ liên kết chỉ đường bên ngoài như màn cũ; thiếu tọa độ thì không đưa liên kết phỏng đoán. */
export function MapLink({ item, cat }: Pick<ItemProps, 'item' | 'cat'>) {
  const place = cat.place(item.placeId);
  if (!place || place.lat === null || place.lon === null) return null;
  return <a className="btn ghost glass-control maplink" href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`} target="_blank" rel="noopener noreferrer" aria-label={fill(C.mapAria, { name: itemName(item, cat) })}><Icon name="map-pin" size="s" />{C.map}</a>;
}

/** Ghi dấu của chính người gọi rồi đọc lại chuyến; khóa nút khi đang gửi và giữ nguyên dữ liệu nếu lỗi. */
function DoneButton({ trip, item, cat, onCompleted }: ItemProps) {
  const { actions } = useTrips();
  const fire = useFire();
  const [busy, setBusy] = useState(false);
  const place = isPlaceItem(item);
  const label = place ? (item.done ? C.unmarkVisited : C.markVisited) : C.toggle;
  /** Chờ actions đọc lại trạng thái máy chủ trước khi mở danh sách đã xong. */
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

/** Thẻ nổi bật dùng ảnh catalog có ghi công; khoảng cách chỉ tính từ mục ngay trước khi đủ cả hai tọa độ. */
export function NextCard({ trip, item, cat, previous, onCompleted }: ItemProps & { readonly previous: TripItem | null }) {
  const place = cat.place(item.placeId);
  const photo = place?.photos[0];
  const coord = coordOf(cat);
  const from = previous?.placeId ? coord(previous.placeId) : null;
  const to = item.placeId ? coord(item.placeId) : null;
  return <section className="today-next panel todayrow">
    {photo ? <figure><RevealImage src={photo.url} alt={place?.name ?? ''} /><figcaption><a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer">{fill(C.photo, { author: photo.author, license: photo.license })}</a></figcaption></figure> : null}
    <div className="today-next-body">
      <Chip tone="sun" icon={isPlaceItem(item) ? 'map-pin' : 'check'}>{isPlaceItem(item) ? C.next : C.nextTask}</Chip>
      <span className="tdtime">{item.timeOfDay ?? C.noTime}</span>
      <h3>{itemName(item, cat)}</h3>
      {previous && from && to ? <p className="note">{fill(C.distance, { km: travelEstimate(from, to).km, name: itemName(previous, cat) })}</p> : null}
      <div className="today-actions"><MapLink item={item} cat={cat} /><DoneButton trip={trip} item={item} cat={cat} onCompleted={onCompleted} /></div>
    </div>
  </section>;
}

/** Dòng gọn giữ giờ thật, bản đồ và thao tác tích/bỏ tích việc hoặc địa điểm của chính người dùng. */
export function TodayItem({ trip, item, cat, onCompleted }: ItemProps) {
  return <li className={`todayrow ${item.done ? 'done' : ''}`}>
    <span className="tdtime">{item.timeOfDay ?? C.noTime}</span>
    <span className="tdbody"><b>{itemName(item, cat)}</b><MapLink item={item} cat={cat} /></span>
    <DoneButton trip={trip} item={item} cat={cat} onCompleted={onCompleted} />
  </li>;
}
