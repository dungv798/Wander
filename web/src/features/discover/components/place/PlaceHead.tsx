import { COPY } from '../../../../shared/const/copy.vi.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';
import type { DestinationDetail, PlaceView } from '../../model/Catalog.types.ts';
import { CATEGORY_ICON } from '../../model/discover.const.ts';

interface PlaceHeadProps {
  readonly dest: DestinationDetail;
  readonly place: PlaceView;
  readonly onClose: () => void;
}

/**
 * The shared head of the detail sheet: the 'Destination / Area' breadcrumb, a close button, the place name and the kind label (a Fluent 3D sticker).
 * This chrome has the same glass material as the app; there is no photo behind it so the name is always readable on a light background.
 */
export function PlaceHead({ dest, place, onClose }: PlaceHeadProps) {
  return (
    <header className="pd-head">
      <div className="pd-crumb">
        <p><Icon name="map-pin" size="s" /><span>{dest.name}</span>{place.area ? <><span aria-hidden="true"> / </span><span>{place.area}</span></> : null}</p>
        <IconButton className="pd-close" icon="x" label={COPY.common.close} onClick={onClose} />
      </div>
      <div className="pd-title">
        <h2 className="place-title">{place.name}</h2>
        <span className="pd-cat"><Icon semantic name={CATEGORY_ICON[place.category]} />{place.categoryName}</span>
      </div>
    </header>
  );
}
