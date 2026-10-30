import { normalizeSearch } from '../../../shared/lib/text.ts';
import type { PlaceRef } from './tripState.ts';
import type { Trip } from './trip.types.ts';
import { tripDays } from './tripMath.ts';

/** Loại địa điểm đã có trong chuyến và mã lặp trong đầu vào; không đổi thứ tự người dùng chọn. */
export function missingPlaces<T extends PlaceRef>(places: readonly T[], trip: Pick<Trip, 'items'>): T[] {
  const seen = new Set(trip.items.map(i => i.placeId));
  return places.filter(place => {
    if (seen.has(place.id)) return false;
    seen.add(place.id);
    return true;
  });
}

/** Bật/tắt lựa chọn duy nhất theo mã, giữ lựa chọn khi đổi ô tìm hoặc chip loại. */
export function togglePlace(chosen: readonly string[], id: string): string[] {
  return chosen.includes(id) ? chosen.filter(value => value !== id) : [...chosen, id];
}

/** Ngày null là chưa xếp; ngày cụ thể phải còn thuộc khoảng ngày của chuyến lúc gửi. */
export function validAddDay(trip: Pick<Trip, 'startDate' | 'endDate'>, day: string | null): boolean {
  return day === null || tripDays(trip).includes(day);
}

/** Tìm không dấu và lọc loại trong các nơi chưa có, không ảnh hưởng tập lựa chọn. */
export function filterAddPlaces<T extends PlaceRef>(places: readonly T[], query: string, category: string | null): T[] {
  const text = normalizeSearch(query);
  return places.filter(place => (!category || place.category === category) && normalizeSearch(place.name ?? place.id).includes(text));
}
