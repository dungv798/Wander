import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';

interface SearchBoxProps {
  readonly className?: string;
  /** `destinations`: searches cities/regions; `places`: searches places inside the currently selected city (needs `city`). */
  readonly scope?: 'destinations' | 'places';
  readonly city?: string;
}

/** The search button has an accessible label: it says whether it is searching destinations or places in which city, then opens the search screen with the right scope. */
export function SearchBox({ className, scope = 'destinations', city }: SearchBoxProps) {
  const places = scope === 'places' && city;
  const label = places ? fill(COPY.destinations.placesSearch, { dest: city }) : COPY.home.searchDestinations;
  return (
    <button type="button" onClick={() => navigate(VIEW.DESTINATIONS, places ? 'places' : null)} aria-label={label} className={['search', 'g-search', className].filter(Boolean).join(' ')}>
      <Icon name="search" />
      <span>{label}</span>
    </button>
  );
}
