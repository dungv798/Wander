import { fill } from '../../../../shared/const/copy.vi.ts';
import { Button } from '../../../../shared/ui/Button.tsx';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { PlacePlaceholder } from '../PlacePlaceholder.tsx';
import type { PlaceView } from '../../model/Catalog.types.ts';
import { firstPhotoThumbUrl } from '../../model/destinationQueries.ts';
import { DEST_COPY } from '../../model/dest.copy.ts';

interface PlaceRowProps {
  readonly place: PlaceView;
  /** Already in the user's 'Selected' set. */
  readonly chosen: boolean;
  readonly onOpen: () => void;
  readonly onToggle: () => void;
}

/**
 * The horizontal card of a place/experience: a real photo on the left (tap = see detail), the name, the area, then 'See detail' and 'Select'.
 * 'Select' is a toggle button (`aria-pressed`): once selected it becomes 'Selected' and tapping again deselects. Every button is at least 44 px high, not dependent on hover.
 */
export function PlaceRow({ place, chosen, onOpen, onToggle }: PlaceRowProps) {
  return (
    <li className={`place-row cat-${place.category}`} data-place-id={place.id}>
      <button className="pr-photo" type="button" data-place-photo={place.id} aria-label={fill(DEST_COPY.openNamed, { name: place.name })} onClick={onOpen}>
        {place.photos.length ? <RevealImage alt="" src={firstPhotoThumbUrl(place)} loading="lazy" /> : <PlacePlaceholder place={place} />}
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
