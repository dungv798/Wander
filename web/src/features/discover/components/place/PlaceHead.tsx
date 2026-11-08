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
 * Đầu tờ chi tiết dùng chung: đường dẫn "Điểm đến / Khu vực", nút đóng, tên nơi và nhãn loại (sticker Fluent 3D).
 * Chrome này cùng chất liệu kính của app; không có ảnh làm nền nên tên luôn đọc được trên nền sáng.
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
