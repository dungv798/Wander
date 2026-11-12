import { fill } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { thumbOrUrl } from '../../discover/index.ts';
import { useTripView } from '../hooks/TripViewContext.tsx';
import { itemName } from '../model/tripView.ts';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';
import type { DeferredReason } from '../model/planDays.ts';

interface PlanItemRowProps {
  readonly itemId: string;
  readonly day?: string;
  readonly index?: number;
  readonly existing?: boolean;
  readonly reason?: DeferredReason;
  readonly disabled: boolean;
  readonly onDay: (itemId: string, day: string) => void;
}

/** Hàng địa điểm cùng hệ ảnh/nút với lịch; chỉ mục đề nghị có chọn ngày, mục cũ và pending không bị chỉnh ngầm. */
export function PlanItemRow({ itemId, day = '', index, existing = false, reason, disabled, onDay }: PlanItemRowProps) {
  const { trip, cat, days, openItem } = useTripView();
  const item = trip.items.find(candidate => candidate.id === itemId);
  if (!item) return null;
  const place = cat.place(item.placeId), photo = place?.photos[0];
  const name = itemName(item, cat);
  return <li className="plan-stop" data-kept={existing}>
    <div className="plan-stop-photo">
      {photo ? <RevealImage alt="" src={thumbOrUrl(photo)} loading="lazy" /> : <Icon semantic name="map-pin" />}
      {index !== undefined ? <span>{index + 1}</span> : null}
    </div>
    <div className="plan-stop-main">
      {place ? <button className="plan-stop-title" type="button" onClick={() => openItem(item.id)}>{name}</button> : <strong>{name}</strong>}
      <small>{existing ? <><Icon name="check" size="s" />{item.timeOfDay ?? T.plan.kept}</> : reason ? T.plan.reasons[reason] : place?.area}</small>
    </div>
    {existing || reason === 'pending' ? null : <select className="plan-stop-day" aria-label={fill(T.plan.moveLabel, { name })} value={day} disabled={disabled} onChange={event => onDay(item.id, event.target.value)}>
      <option value="">{T.plan.selectDay}</option>
      {days.map((date, number) => <option key={date} value={date}>{fill(T.view.day, { n: number + 1 })}</option>)}
    </select>}
    {reason === 'pending' ? <span className="plan-held-icon" aria-hidden="true"><Icon name="clock" /></span> : null}
  </li>;
}
