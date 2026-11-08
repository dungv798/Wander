import { fill } from '../../../../shared/const/copy.vi.ts';
import { Button } from '../../../../shared/ui/Button.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { PlacePlaceholder } from '../PlacePlaceholder.tsx';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { firstPhotoUrl } from '../../model/destinationQueries.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';

interface PlaceRowProps {
  readonly place: PlaceView;
  /** Đã nằm trong tập "Đã chọn" của người dùng. */
  readonly chosen: boolean;
  readonly onOpen: () => void;
  readonly onToggle: () => void;
}

/**
 * Thẻ ngang của một nơi/trải nghiệm: ảnh thật bên trái (chạm = xem chi tiết), tên, khu vực, rồi "Xem chi tiết" và "Chọn".
 * "Chọn" là nút bật/tắt (`aria-pressed`): chọn rồi thì thành "Đã chọn" và chạm lại sẽ bỏ chọn. Mọi nút cao ≥ 44 px, không phụ thuộc hover.
 */
export function PlaceRow({ place, chosen, onOpen, onToggle }: PlaceRowProps) {
  return (
    <li className={`place-row cat-${place.category}`} data-place-id={place.id}>
      <button className="pr-photo" type="button" data-place-photo={place.id} aria-label={fill(DEST_COPY.openNamed, { name: place.name })} onClick={onOpen}>
        {place.photos.length ? <RevealImage alt="" src={firstPhotoUrl(place)} loading="lazy" /> : <PlacePlaceholder place={place} />}
        <span className="pr-cat">{place.id.startsWith('exp-') ? DEST_COPY.experience : place.categoryName}</span>
        {place.photos[0]?.caption ? <span className="pr-photo-caption">{place.photos[0].caption}</span> : null}
      </button>
      <div className="pr-body">
        <button className="pr-title" type="button" onClick={onOpen}><h3>{place.name}</h3></button>
        <p className="pr-area"><Icon name="map-pin" size="s" />{place.area}</p>
        <div className="pr-actions">
          <small>{place.id.startsWith('exp-') ? DEST_COPY.areaAnchor : DEST_COPY.placeAnchor}</small>
          <Button kind={chosen ? 'ghost' : 'primary'} icon={chosen ? 'check' : 'plus'} aria-pressed={chosen} aria-label={fill(chosen ? DEST_COPY.unchooseNamed : DEST_COPY.chooseNamed, { name: place.name })} onClick={onToggle}>
            {chosen ? DEST_COPY.chosen : DEST_COPY.choose}
          </Button>
        </div>
      </div>
    </li>
  );
}
