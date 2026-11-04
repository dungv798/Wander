import type { MapMarker, MapRoute } from '../../../shared/map/map.types.ts';
import { onboardPhotoUrl } from './onboardPhotos.ts';
import type { TripDay, TripItem, TripStop } from './onboarding.types.ts';

/** Các mục là địa điểm (có ghim) của một ngày. */
export function stopsOf(day: TripDay): TripStop[] {
  return day.items.flatMap((item) => (item.kind === 'stop' ? [item] : []));
}

/** Số địa điểm đã lộ ra khi danh sách mới hiện `rows` dòng đầu (khoảng nghỉ không tính). */
export function stopsRevealed(items: readonly TripItem[], rows: number): number {
  return items.slice(0, rows).filter((i) => i.kind === 'stop').length;
}

/** Ghim của một ngày: địa điểm đã lộ ra có ảnh và số khớp danh sách, địa điểm chưa tới lượt là chấm nhỏ mờ (để camera vẫn vừa cả ngày). */
export function dayMarkers(day: TripDay, revealed: number): MapMarker[] {
  return stopsOf(day).map((s) => {
    const base = { id: s.place.id, lat: s.place.lat as number, lon: s.place.lon as number, thumb: onboardPhotoUrl(s.place) };
    return s.num <= revealed ? { ...base, label: s.place.name, num: s.num } : { ...base, muted: true };
  });
}

/** Ghim tổng quan cả chuyến: ảnh tròn, chưa đánh số (số chỉ có nghĩa trong từng ngày). */
export function overviewMarkers(days: readonly TripDay[]): MapMarker[] {
  return days.flatMap((d) => stopsOf(d).map((s) => ({ id: s.place.id, lat: s.place.lat as number, lon: s.place.lon as number, thumb: onboardPhotoUrl(s.place) })));
}

/** Đường nối theo thứ tự ghé thăm của một ngày, chỉ hiện khi đã lộ đủ ghim (rồi mới vẽ). Không có nhãn km. */
export function dayRoute(day: TripDay, revealed: number): MapRoute | null {
  const ids = stopsOf(day).map((s) => s.place.id);
  return ids.length > 1 && revealed >= ids.length ? { ids, labels: [], viewKey: `onboard-day-${day.index}` } : null;
}

/** Mã các địa điểm của một ngày (để vừa khung camera), hoặc null = cả chuyến. */
export function fitIds(day: TripDay | null): string[] | null {
  return day ? stopsOf(day).map((s) => s.place.id) : null;
}
