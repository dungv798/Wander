import { COPY, fill } from '../../../../shared/const/copy.vi.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';

interface SearchBoxProps {
  readonly className?: string;
  /** `destinations`: tìm thành phố/vùng; `places`: tìm địa điểm bên trong thành phố đang chọn (cần `city`). */
  readonly scope?: 'destinations' | 'places';
  readonly city?: string;
}

/** Nút tìm có nhãn truy cập: nói rõ đang tìm điểm đến hay địa điểm trong thành phố nào, rồi mở màn tìm đúng phạm vi. */
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
