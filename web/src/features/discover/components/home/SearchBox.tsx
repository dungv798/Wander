import { COPY } from '../../../../shared/const/copy.vi.ts';
import { navigate } from '../../../../shared/router/hashRoute.ts';
import { VIEW } from '../../../../shared/const/routes.const.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';

interface SearchBoxProps {
  readonly className?: string;
}

/** Nút tìm có nhãn truy cập, mở màn chọn điểm đến toàn màn bằng chuột hoặc bàn phím. */
export function SearchBox({ className }: SearchBoxProps) {
  return (
    <button type="button" onClick={() => navigate(VIEW.DESTINATIONS)} aria-label={COPY.home.searchLabel} className={['search', className].filter(Boolean).join(' ')}>
      <Icon name="compass" />
      <span>{COPY.destinations.title}</span>
    </button>
  );
}
