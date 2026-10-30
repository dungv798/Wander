import type { MealGap, MealGapEditor } from './mealGaps.ts';
import { mealGapEditor } from './mealGaps.ts';
import type { TripItem } from './trip.types.ts';
import type { TripCatalog } from './tripView.ts';
import type { PoiSuggestion } from '../api/poi.api.ts';
import { MEAL_SUGGEST as R } from './mealSuggest.const.ts';
import { MEAL_SUGGEST_COPY as C } from './mealSuggest.copy.ts';

export interface MealAnchor { readonly lat: number; readonly lon: number; readonly name: string }
type AnchorItem = Pick<TripItem, 'day' | 'placeId' | 'position' | 'timeOfDay'>;

/** Chỉ đọc giờ lịch hợp lệ; không suy diễn giờ mở cửa hay giờ chưa nhập. */
function timeMinutes(time: string | null): number | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour! * R.minutesPerHour + minute!;
}

/** Chọn mốc có tọa độ theo thứ tự lịch: tối cuối ngày, nghỉ giữa ngày, trưa gần 12h hoặc trọng tâm. */
export function mealAnchor(items: readonly AnchorItem[], day: string, gap: MealGap, place: TripCatalog['place']): MealAnchor | null {
  const points = items.filter(i => i.day === day).slice().sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)).flatMap(i => {
    const p = place(i.placeId);
    return p && p.lat !== null && p.lon !== null && Number.isFinite(p.lat) && Number.isFinite(p.lon)
      ? [{ lat: p.lat, lon: p.lon, name: p.name, time: timeMinutes(i.timeOfDay) }] : [];
  });
  if (!points.length) return null;
  const selected = gap === 'dinner' ? points[points.length - 1] : gap === 'rest' ? points[Math.floor((points.length - 1) / R.midpointDivisor)] : undefined;
  if (selected) return { lat: selected.lat, lon: selected.lon, name: selected.name };
  const timed = points.filter(p => p.time !== null).sort((a, b) => Math.abs(a.time! - R.noonMinutes) - Math.abs(b.time! - R.noonMinutes));
  const noon = timed[0] ?? (points.length === 1 ? points[0] : undefined);
  if (noon) return { lat: noon.lat, lon: noon.lon, name: noon.name };
  return { lat: points.reduce((sum, p) => sum + p.lat, 0) / points.length, lon: points.reduce((sum, p) => sum + p.lon, 0) / points.length, name: C.centroid };
}

/** Nghỉ ưu tiên cafe; bữa chính chỉ tìm food, không mặc định cafe phục vụ cơm. */
export function mealPoiKind(gap: MealGap): 'food' | 'cafe' {
  return gap === 'rest' ? 'cafe' : 'food';
}

/** Điền bản nháp tự do có nguồn; không gắn placeId POI vào catalog Discover và không lưu. */
export function poiEditor(gap: MealGap, day: string, poi: PoiSuggestion): MealGapEditor {
  return { ...mealGapEditor(gap, day), initial: { day, title: poi.name, note: [C.sourceNote, poi.address].filter(Boolean).join('\n') } };
}
