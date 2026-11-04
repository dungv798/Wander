import { COPY } from '../../../shared/const/copy.vi.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import type { PlaceView } from '../model/Catalog.types.ts';
import { CATEGORY_ICON } from '../model/discover.const.ts';

/**
 * Ô giữ chỗ khi địa điểm CHƯA có ảnh đã tuyển: biểu tượng và tên loại thật của địa điểm, kèm dòng "Chưa có ảnh".
 * Không dùng ảnh của nơi khác hay ảnh dựng; chỉ để địa điểm vẫn tìm được, chọn được và xếp được vào lịch.
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
