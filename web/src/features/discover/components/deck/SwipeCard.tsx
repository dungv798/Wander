import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import type { PointerEvent } from 'react';
import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { Chip } from '../../../../shared/ui/Chip.tsx';
import { useCreditPill } from '../../hooks/useCreditPill.ts';
import { CATEGORY_ICON } from '../../model/discover.const.ts';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { mainAway, photoAt } from '../../model/destinationQueries.ts';
import { CreditPill } from '../CreditPill.tsx';

interface FrontHandlers {
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

interface SwipeCardProps {
  readonly place: PlaceView;
  /** 0 = thẻ trên cùng (quẹt được); 1, 2 = thẻ phía sau. */
  readonly depth: number;
  readonly photoIndex: number;
  /** Bộ xử lý kéo; chỉ truyền cho thẻ trên cùng. */
  readonly handlers?: FrontHandlers;
}

/** Phần chữ nổi trên ảnh (gọn để ảnh là nhân vật chính): loại, nút nguồn ảnh (thẻ trên cùng), tên, khu vực kèm quãng đường, mùa đẹp và thời lượng. */
function CardInfo({ place, front, onCredit }: { readonly place: PlaceView; readonly front: boolean; readonly onCredit: () => void }) {
  const away = mainAway(place);
  return (
    <div className="card-info">
      <div className="card-top">
        <Chip className="card-cat" icon={CATEGORY_ICON[place.category]}>{place.categoryName}</Chip>
        {front ? (
          <button className="credit-btn" type="button" aria-label={COPY.deck.creditAria} onClick={onCredit}>
            <Icon name="info-circle" />
          </button>
        ) : null}
      </div>
      <h2>{place.name}</h2>
      <p className="card-area">
        <Icon name="map-pin" size="s" />
        {place.area}
      </p>
      <ul className="card-facts">
        <li><Chip tone="glass" icon="calendar-event">{place.bestLabel}</Chip></li>
        <li><Chip tone="glass" icon="clock">{place.duration}</Chip></li>
        {away ? <li><Chip tone="glass" icon="route">{fill(COPY.units.kmApprox, { km: away.km })}</Chip></li> : null}
      </ul>
    </div>
  );
}

/**
 * Thẻ quẹt toàn màn (v6, PO 26/10/2026): ảnh của địa điểm là nền; tên, thông tin và dấu THÍCH/BỎ QUA nổi đè lên ảnh.
 * Thẻ trên cùng nhận cử chỉ kéo; các thẻ phía sau chỉ trang trí (`aria-hidden`).
 */
export function SwipeCard({ place, depth, photoIndex, handlers }: SwipeCardProps) {
  const front = depth === 0;
  const credit = useCreditPill(photoIndex);
  const photo = photoAt(place, photoIndex);
  return (
    <article
      className={`card cat-${place.category} ${front ? 'front' : `depth-${depth}`}`}
      data-id={place.id}
      aria-label={front ? `${place.name}. ${COPY.deck.cardAria}` : undefined}
      aria-hidden={front ? undefined : true}
      {...(front ? handlers : {})}
    >
      <RevealImage className="ph" alt="" src={photo?.url} />
      <div className="card-veil" aria-hidden="true" />
      {place.photos.length > 1 ? (
        <div className="segs" aria-hidden="true">
          {place.photos.map((p, k) => (
            <i key={p.url} className={k <= photoIndex ? 'on' : undefined} />
          ))}
        </div>
      ) : null}
      <span className="stamp r" aria-hidden="true">
        <Icon name="check" />
      </span>
      <span className="stamp l" aria-hidden="true">
        <Icon name="x" />
      </span>
      <CardInfo place={place} front={front} onCredit={credit.toggle} />
      {front && credit.open ? <CreditPill photo={photo} /> : null}
    </article>
  );
}
