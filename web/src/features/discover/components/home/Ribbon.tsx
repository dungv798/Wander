import { Icon } from '../../../../shared/ui/Icon.tsx';
import type { DestinationDetail } from '../../model/Catalog.types.ts';

/** Dải tên các nơi thật chạy ngang (chỉ trang trí, ẩn với trình đọc màn hình). Danh sách nhân đôi để vòng lặp CSS liền mạch. */
export function Ribbon({ dest }: { readonly dest: DestinationDetail }) {
  const loop = [0, 1];
  return (
    <div className="ribbon" aria-hidden="true">
      <div className="ribbon-track">
        {loop.flatMap((copy) =>
          dest.places.map((p) => (
            <span key={`${copy}-${p.id}`}>
              <Icon name="map-pin" size="s" />
              {p.name}
            </span>
          )),
        )}
      </div>
    </div>
  );
}
