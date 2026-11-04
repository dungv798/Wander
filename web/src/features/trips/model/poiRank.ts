import type { PoiSuggestion } from '../api/poi.api.ts';
import type { MealGap } from './mealGaps.ts';
import type { MealAnchor } from './mealSuggest.ts';
import type { TripItem } from './trip.types.ts';
import type { TripCatalog } from './tripView.ts';

/** Loại hiển thị của một quán sau khi đối chiếu tên: nguồn gắn nhãn quán ăn nhưng tên là cà phê/trà thì coi là cà phê. */
export type PoiKind = PoiSuggestion['kind'];

/** Tên chuỗi cà phê/trà phổ biến; chỉ để sửa nhãn loại hiển thị, không bịa thông tin quán. */
const COFFEE_NAME = /\b(coffee|cafe|caphe|ca phe|cà phê|highland|highlands|trà|tra sua|trà sữa|tea|milk tea|phuc long|the coffee house)\b/iu;

/** Bỏ dấu để so tên ("Cà phê" ~ "ca phe"). */
function plain(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
}

/** Nhãn loại hiển thị: tên cà phê/trà thì là cà phê dù nguồn ghi quán ăn; còn lại giữ loại nguồn. */
export function displayKind(poi: Pick<PoiSuggestion, 'kind' | 'name'>): PoiKind {
  if (poi.kind === 'food' && COFFEE_NAME.test(plain(poi.name))) return 'cafe';
  return poi.kind;
}

/** Thứ tự loại quán ưu tiên theo bữa: bữa chính ưu tiên quán ăn, nghỉ ưu tiên cà phê. Loại không có trong danh sách xếp cuối. */
const KIND_ORDER: Readonly<Record<MealGap, readonly PoiKind[]>> = { lunch: ['food', 'fast_food', 'cafe'], dinner: ['food', 'fast_food', 'cafe'], rest: ['cafe', 'food', 'fast_food'] };

/** Thứ hạng của một loại cho một bữa; thấp hơn = lên trước. */
function kindRank(kind: PoiKind, gap: MealGap): number {
  const index = KIND_ORDER[gap].indexOf(kind);
  return index < 0 ? KIND_ORDER[gap].length : index;
}

/** Sắp quán cho một bữa: đúng loại trước, rồi gần trước; không loại bỏ quán nào (chỉ xếp lại). */
export function rankPoi(list: readonly PoiSuggestion[], gap: MealGap): PoiSuggestion[] {
  return [...list].sort((a, b) => kindRank(displayKind(a), gap) - kindRank(displayKind(b), gap) || a.distanceM - b.distanceM || a.id.localeCompare(b.id));
}

const METERS_PER_KM = 1000;
const ROUND_METERS = 10;
const TENTH_KM_METERS = 100;
const MIN_METERS = 10;

/** Khoảng cách dễ đọc: dưới 1 km là mét làm tròn 10, từ 1 km là km một chữ số thập phân (dấu phẩy). */
export function formatDistance(meters: number): string {
  if (meters < METERS_PER_KM) return `${Math.max(MIN_METERS, Math.round(meters / ROUND_METERS) * ROUND_METERS)} m`;
  return `${(Math.round(meters / TENTH_KM_METERS) / ROUND_METERS).toString().replace('.', ',')} km`;
}

const MIN_FOR_CENTROID = 2;

/** Một mốc có thể chọn để tìm quán gần đó. */
export interface AnchorOption extends MealAnchor { readonly key: string }

/** Các mốc có tọa độ trong ngày theo thứ tự lịch, để người dùng chọn "gần điểm nào"; `centroid` là trọng tâm các điểm đó (nếu hơn một điểm). */
export function dayAnchors(items: readonly Pick<TripItem, 'day' | 'placeId' | 'position'>[], day: string, place: TripCatalog['place'], centroidName: string): AnchorOption[] {
  const points = items.filter((i) => i.day === day).slice().sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)).flatMap((i) => {
    const p = place(i.placeId);
    return p && p.lat !== null && p.lon !== null && Number.isFinite(p.lat) && Number.isFinite(p.lon) ? [{ key: `item:${i.placeId}`, lat: p.lat, lon: p.lon, name: p.name }] : [];
  });
  if (points.length < MIN_FOR_CENTROID) return points;
  const lat = points.reduce((s, p) => s + p.lat, 0) / points.length;
  const lon = points.reduce((s, p) => s + p.lon, 0) / points.length;
  return [...points, { key: 'centroid', lat, lon, name: centroidName }];
}
