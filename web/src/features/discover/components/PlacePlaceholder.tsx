import { COPY } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { PlaceView } from '../model/Catalog.types.ts';
import { CATEGORY_ICON } from '../model/discover.const.ts';

/**
 * The placeholder when a place has NO curated photo yet: an icon and the real kind name of the place, with a 'No photo yet' line.
 * It does not use another place's photo or a generated one; it only keeps the place findable, selectable and schedulable.
 */
export function PlacePlaceholder({ place, className }: { readonly place: Pick<PlaceView, 'category' | 'categoryName' | 'name'>; readonly className?: string }) {
  return (
    <div className={['photo-ph', `cat-${place.category}`, className].filter(Boolean).join(' ')} role="img" aria-label={`${place.name}. ${COPY.place.noPhoto}`}>
      <Icon name={CATEGORY_ICON[place.category]} size="l" />
      <b>{place.categoryName}</b>
      <small>{COPY.place.noPhoto}</small>
    </div>
  );
}
