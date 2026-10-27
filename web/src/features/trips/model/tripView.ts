import type { DestinationDetail, PlaceView } from '../../discover/index.ts';
import { ITEM_KINDS } from './trip.const.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { TRIPS_COPY } from './trips.copy.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';

/** Điểm đến của chuyến cùng tra cứu địa điểm theo mã (địa điểm đã bị gỡ khỏi kho thì trả null, mục vẫn hiện được bằng tên trống). */
export interface TripCatalog {
  readonly dest: DestinationDetail;
  readonly place: (id: string | null) => PlaceView | null;
}

/** Dựng bộ tra cứu địa điểm cho một điểm đến. */
export function catalogOf(dest: DestinationDetail): TripCatalog {
  const byId = new Map(dest.places.map((p) => [p.id, p]));
  return { dest, place: (id) => (id ? (byId.get(id) ?? null) : null) };
}

/** Tên hiển thị của mục: tên địa điểm trong kho, hoặc tên tự đặt, hoặc nhãn loại. */
export function itemName(item: TripItem, cat: TripCatalog): string {
  return cat.place(item.placeId)?.name ?? (item.title || ITEM_KINDS[item.type].label);
}

/** Tọa độ của địa điểm trong kho (null nếu chưa có). */
export function coordOf(cat: TripCatalog): (placeId: string) => GeoPoint | null {
  return (id) => {
    const p = cat.place(id);
    return p && p.lat !== null && p.lon !== null ? { lat: p.lat, lon: p.lon } : null;
  };
}

/** Dòng "n địa điểm · m mục khác" của một chuyến. */
export function countText(t: Pick<Trip, 'items'>): string {
  const places = t.items.filter((i) => i.placeId).length;
  const other = t.items.length - places;
  return other ? fill(TRIPS_COPY.list.countOther, { n: places, o: other }) : fill(TRIPS_COPY.list.count, { n: places });
}

/** Mốc chính của điểm đến (mốc đầu tiên có tọa độ), để gợi ý xếp ngày xuất phát từ đó. */
export function hubPoint(dest: DestinationDetail): GeoPoint | null {
  const r = dest.references[0];
  return r && r.lat !== undefined && r.lon !== undefined ? { lat: r.lat, lon: r.lon } : null;
}


