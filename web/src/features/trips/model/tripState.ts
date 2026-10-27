import { LIMITS } from '../../../shared/const/limits.const.ts';
import { randomId } from '../../../shared/lib/randomId.ts';
import type { Trip, TripItem, TripsState } from './trip.types.ts';
import { dayItems, tripDays } from './tripMath.ts';

/** Nguồn mã định danh (thay được khi test, nguyên lý D). */
export type IdSource = () => string;

/** Nguồn mã mặc định: xem `shared/lib/randomId.ts`. */
export { randomId };

/** Trạng thái ban đầu: chưa có chuyến nào. */
export const INITIAL_TRIPS_STATE: TripsState = { trips: [] };

/** Hậu tố đầu tiên khi tên trùng (" - 2") và độ dài mã ngắn khi hết hậu tố. */
const FIRST_SUFFIX = 2;
const SHORT_ID_LENGTH = 4;

/** Tên chuyến không trùng (DR-006): thêm hậu tố " - 2", " - 3"… khi trùng (cắt phần đầu để tên vẫn ≤ 120 ký tự); quá 200 lần thử thì thêm mã ngắn. */
export function uniqueName(trips: readonly Trip[], base: string, id: IdSource = randomId): string {
  const names = new Set(trips.map((t) => t.name));
  if (!names.has(base)) return base;
  const withSuffix = (suffix: string): string => `${base.slice(0, LIMITS.MAX_TRIP_NAME - suffix.length)}${suffix}`;
  for (let n = FIRST_SUFFIX; n < LIMITS.MAX_NAME_SUFFIX; n += 1) if (!names.has(withSuffix(` - ${n}`))) return withSuffix(` - ${n}`);
  return withSuffix(` - ${id().slice(0, SHORT_ID_LENGTH)}`);
}

/** Thông tin để tạo một chuyến mới. */
export interface NewTrip {
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly datesTentative?: boolean;
  readonly kind?: string | null;
  readonly interests?: readonly string[];
  readonly styles?: readonly string[];
  readonly pace?: string | null;
  readonly budgetK?: number | null;
}

/** Địa điểm cần thêm vào chuyến (chỉ cần mã và loại địa điểm trong kho để suy ra loại mục). */
export interface PlaceRef {
  readonly id: string;
  /** Tên hiển thị (nếu có): backend bắt buộc mục có tiêu đề, nên mục từ kho mang tên làm tiêu đề lưu kèm. */
  readonly name?: string;
  readonly category: string;
}

/**
 * Đánh số lại thứ tự 0..n-1 trong từng ngày (giữ thứ tự hiện có; mục `position` trống xếp cuối theo thứ tự thêm) và bỏ thứ tự của mục
 * chưa có ngày. Gọi sau mọi thao tác đổi ngày/thêm/bớt để không còn lỗ hổng hay trùng số (bất biến 0..n-1 như backend `Trip.renumber`).
 */
export function normalize(t: Trip): Trip {
  const order = new Map<string, number>();
  for (const d of new Set(t.items.flatMap((i) => (i.day ? [i.day] : [])))) dayItems(t, d).forEach((i, k) => order.set(i.id, k));
  return { ...t, items: t.items.map((i) => (i.day ? { ...i, position: order.get(i.id) ?? null } : { ...i, position: null })) };
}

/** Thay đổi cho phép khi sửa một mục. */
export type ItemPatch = Partial<Omit<TripItem, 'id' | 'placeId'>>;

/** Kết quả gợi ý xếp ngày: mã mục → ngày và vị trí. */
export type DayPlan = Readonly<Record<string, { readonly day: string; readonly position: number }>>;

/** Thông tin sửa chuyến (tên, ngày) và tùy chọn dời lịch. */
export interface TripEdit {
  readonly name: string;
  readonly startDate: string;
  readonly endDate: string;
  /** Giữ nguyên số ngày thì dời cả lịch theo ngày mới. */
  readonly shift: boolean;
  /** Bỏ nhãn "chưa chắc" (đã chốt ngày). */
  readonly confirmDates: boolean;
}

/** Kết quả sửa chuyến: chuyến mới, số mục và mã các mục rơi khỏi khoảng ngày (về "Chưa có ngày", A1 DR-011). */
export interface EditResult {
  readonly trip: Trip;
  readonly lost: number;
  readonly lostIds: readonly string[];
}

/** Sửa tên/ngày chuyến. Mục nằm ở ngày bị cắt về "Chưa có ngày" thay vì chặn (DR-011 A1 = b); mã các mục bị đẩy ra trả ở `lostIds`. */
export function editTrip(t: Trip, e: TripEdit): EditResult {
  const oldDays = tripDays(t);
  const newDays = tripDays({ startDate: e.startDate, endDate: e.endDate });
  const same = newDays.length === oldDays.length && e.shift;
  const mapDay = (d: string | null): string | null => {
    if (!d) return null;
    if (same) return newDays[oldDays.indexOf(d)] ?? null;
    return newDays.includes(d) ? d : null;
  };
  const lostIds = t.items.filter((i) => i.day && !mapDay(i.day)).map((i) => i.id);
  const items = t.items.map((i) => ({ ...i, day: mapDay(i.day) }));
  /** Thùng rác dời theo lịch cùng quy tắc (ngày không nằm trong khoảng cũ giữ nguyên để khôi phục báo đúng lý do). */
  const trash = t.trash.map((x) => (same && x.day && oldDays.includes(x.day) ? { ...x, day: newDays[oldDays.indexOf(x.day)] ?? null } : x));
  return { trip: normalize({ ...t, name: e.name, startDate: e.startDate, endDate: e.endDate, datesTentative: e.confirmDates ? false : t.datesTentative, items, trash }), lost: lostIds.length, lostIds };
}
