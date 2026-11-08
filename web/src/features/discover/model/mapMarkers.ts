import type { MapMarker } from '../../../shared/map/map.types.ts';
import type { DestinationDetail, PlaceView } from './Catalog.types.ts';
import { firstPhotoUrl } from './destinationQueries.ts';
import { FLUENT_ICONS, FLUENT_PATH, FLUENT_SUFFIX } from '../../../shared/ui/icons/fluentIcons.const.ts';
import { CATEGORY_ICON } from './discover.const.ts';
import type { CategoryCode } from './Catalog.types.ts';

/** Tái sử dụng ảnh icon của danh sách/chi tiết; loại chưa có sticker thì vẫn dùng ảnh thật. */
export function categorySticker(category: CategoryCode): string | undefined {
  const icon = FLUENT_ICONS[CATEGORY_ICON[category]];
  return icon ? `${FLUENT_PATH}${icon}${FLUENT_SUFFIX}` : undefined;
}

/** Ghim cho mọi địa điểm có tọa độ (ảnh tròn thật + tên). */
export function placeMarkers(places: readonly PlaceView[]): MapMarker[] {
  return places.filter((p) => p.lat != null && p.lon != null).map((p) => {
    return { id: p.id, lat: p.lat as number, lon: p.lon as number, label: p.name, thumb: firstPhotoUrl(p) };
  });
}

/** Ghim đánh số 1, 2, 3… cho danh sách địa điểm đã chọn (chỉ nơi có tọa độ). */
export function numberedMarkers(places: readonly PlaceView[]): MapMarker[] {
  return placeMarkers(places).map((m, i) => ({ ...m, num: i + 1 }));
}

/** Mốc chính của điểm đến (ví dụ TP Hà Giang) dạng ghim `hub`; null nếu mốc chưa có tọa độ. */
export function hubMarker(dest: DestinationDetail): MapMarker | null {
  const r = dest.references[0];
  return r && r.lat != null && r.lon != null ? { id: 'hub', lat: r.lat, lon: r.lon, label: r.name, kind: 'hub' } : null;
}
