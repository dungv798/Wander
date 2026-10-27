import type { MapMarker } from '../../../shared/map/map.types.ts';
import type { DestinationDetail, PlaceView } from './Catalog.types.ts';
import { firstPhotoUrl } from './destinationQueries.ts';

/** Ghim cho mọi địa điểm có tọa độ (ảnh tròn thật + tên). */
export function placeMarkers(places: readonly PlaceView[]): MapMarker[] {
  return places.filter((p) => p.lat != null && p.lon != null).map((p) => ({ id: p.id, lat: p.lat as number, lon: p.lon as number, label: p.name, thumb: firstPhotoUrl(p) }));
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
