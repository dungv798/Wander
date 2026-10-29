import { MEAL_GAPS_COPY as M, MEAL_GAPS_RULES as R } from './mealGaps.copy.ts';
import type { TripItem } from './trip.types.ts';

export type MealGap = 'lunch' | 'dinner' | 'rest';

/** Dữ liệu mở trình sửa từ nhắc; không phải lệnh tạo hoặc lưu mục. */
export interface MealGapEditor {
  readonly kind: 'editor';
  readonly itemId: null;
  readonly preset: 'food' | 'rest';
  readonly initial: { readonly day: string; readonly title: string };
}

/** Gắn ngày và tên bữa/nghỉ vào bản nháp, không suy diễn giờ hay giá. */
export function mealGapEditor(gap: MealGap, day: string): MealGapEditor {
  return { kind: 'editor', itemId: null, preset: gap === 'rest' ? 'rest' : 'food', initial: { day, title: M[gap].suggestedTitle } };
}
type GapItem = Pick<TripItem, 'day' | 'type' | 'title' | 'placeId' | 'timeOfDay' | 'durationMin'>;
type PlaceLookup = (id: string | null) => { readonly category: string; readonly name: string } | null;

/** Bỏ dấu tiếng Việt, giữ ranh giới từ để không nhận nhầm “An” trong “Hoàng”. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').replace(/[đĐ]/g, 'd').toLowerCase();
}

/** Đọc giờ đã nhập thành phút, không suy diễn giờ khi rỗng hay sai định dạng. */
function minutes(time: string | null): number | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour! * R.minutesPerHour + minute!;
}

/** Nhận diện nhẹ theo loại, catalog hoặc tên; bữa rõ trưa/tối không che bữa còn lại. */
function recognized(item: GapItem, place: PlaceLookup): readonly MealGap[] {
  const p = place(item.placeId);
  const text = normalize(`${item.title} ${p?.name ?? ''}`);
  const rest = item.type === 'rest' || /\bnghi\b/.test(text);
  const food = item.type === 'food' || R.foodCategories.some((c) => c === p?.category) || /\b(an|com|pho|ca phe|trua|toi)\b/.test(text);
  const result: MealGap[] = rest ? ['rest'] : [];
  if (!food || (rest && item.type !== 'food')) return result;
  const lunch = /\btrua\b/.test(text);
  const dinner = /\btoi\b/.test(text);
  if (lunch) result.push('lunch');
  if (dinner) result.push('dinner');
  if (!lunch && !dinner) {
    const time = minutes(item.timeOfDay);
    if (time === null) result.push('lunch', 'dinner');
    else if (time >= R.eveningStart) result.push('dinner');
    else if (time >= R.noonStart && time <= R.noonEnd) result.push('lunch');
  }
  return result;
}

/** Tìm khoảng còn thiếu của đúng ngày; chỉ đọc giờ/thời lượng thật, không thêm hay xếp mục. */
export function mealGaps(items: readonly GapItem[], day: string, place: PlaceLookup, dismissed: readonly MealGap[] = []): MealGap[] {
  const selected = items.filter((i) => i.day === day);
  const occupied = new Set(selected.flatMap((i) => recognized(i, place)));
  const sights = selected.filter((i) => (i.type === 'sightseeing' || i.type === 'tour') && recognized(i, place).length === 0);
  if (!sights.length) return [];
  const starts = selected.flatMap((i) => { const t = minutes(i.timeOfDay); return t === null ? [] : [t]; });
  const ends = selected.flatMap((i) => { const t = minutes(i.timeOfDay); return t === null ? [] : [t + (i.durationMin ?? 0)]; });
  const spansNoon = starts.length > 0 && Math.min(...starts) <= R.noonStart && Math.max(...ends) >= R.noonEnd;
  const candidates: MealGap[] = [];
  if (sights.length >= R.lunchPlaces || spansNoon) candidates.push('lunch');
  if (ends.some((t) => t >= R.eveningStart)) candidates.push('dinner');
  if (sights.length >= R.restPlaces) candidates.push('rest');
  return candidates.filter((gap) => !occupied.has(gap) && !dismissed.includes(gap));
}

/** Khóa riêng theo chuyến và ngày; không lưu danh tính hay dữ liệu lịch. */
export function mealGapStorageKey(tripId: string, day: string): string {
  return `${R.storagePrefix}:${tripId}:${day}`;
}

/** Đọc trạng thái đóng; lưu trữ hỏng hoặc bị chặn không cản xem lịch. */
export function readMealGapDismissals(key: string): MealGap[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(saved) ? saved.filter((v): v is MealGap => v === 'lunch' || v === 'dinner' || v === 'rest') : [];
  } catch { return []; }
}

/** Lưu lựa chọn đóng; vẫn cho đóng trong phiên nếu trình duyệt không cho ghi. */
export function saveMealGapDismissals(key: string, gaps: readonly MealGap[]): void {
  try { localStorage.setItem(key, JSON.stringify(gaps)); } catch { /* Nhắc nhẹ không chặn lịch. */ }
}
