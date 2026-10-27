import { LIMITS } from '../../../shared/const/limits.const.ts';
import { randomId } from '../../../shared/lib/randomId.ts';
import { PLACE_KIND } from './trip.const.ts';
import type { ItemKind, Trip, TripItem, TripsState } from './trip.types.ts';
import { dayItems, isPlain, tripDays } from './tripMath.ts';

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
  readonly category: string;
}

/** Một mục từ địa điểm trong kho: chưa có ngày, loại suy ra từ loại địa điểm, chưa biết giá. */
export function placeItem(place: PlaceRef, id: IdSource = randomId): TripItem {
  const type = PLACE_KIND[place.category] ?? 'sightseeing';
  return { id: id(), placeId: place.id, type, title: '', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false };
}

/** Mục tự do (hoặc Nghỉ, Việc cần làm): giá/đặt chỗ chỉ có ở loại có giá. */
export function freeItem(type: ItemKind, title: string, id: IdSource = randomId): TripItem {
  return { id: id(), placeId: null, type, title, day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: isPlain(type) ? null : 'pending', done: false };
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

/** Tạo chuyến mới (kèm các địa điểm đã chọn ở mục "Chưa có ngày"); trả trạng thái mới và chuyến vừa tạo. */
export function createTrip(s: TripsState, n: NewTrip, places: readonly PlaceRef[], id: IdSource = randomId, now: number = Date.now()): { state: TripsState; trip: Trip } {
  const trip: Trip = {
    id: id(), name: uniqueName(s.trips, n.name, id), destinationId: n.destinationId, startDate: n.startDate, endDate: n.endDate, datesTentative: n.datesTentative ?? false,
    kind: n.kind ?? null, interests: n.interests ?? [], styles: n.styles ?? [], pace: n.pace ?? null, budgetK: n.budgetK ?? null, items: places.map((p) => placeItem(p, id)), trash: [], createdAt: now,
  };
  return { state: { trips: [...s.trips, trip] }, trip };
}

/** Thay một chuyến theo mã bằng kết quả của `change`; chuyến không có thì giữ nguyên. */
export function mapTrip(s: TripsState, tripId: string, change: (t: Trip) => Trip): TripsState {
  return { trips: s.trips.map((t) => (t.id === tripId ? change(t) : t)) };
}

/** Thêm các địa điểm chưa có trong chuyến (không thêm trùng) vào "Chưa có ngày". */
export function addPlaces(t: Trip, places: readonly PlaceRef[], id: IdSource = randomId): Trip {
  const have = new Set(t.items.map((i) => i.placeId));
  return { ...t, items: [...t.items, ...places.filter((p) => !have.has(p.id)).map((p) => placeItem(p, id))] };
}

/** Thêm một mục đã dựng sẵn; nếu có ngày thì xếp vào cuối ngày đó. */
export function addItem(t: Trip, item: TripItem): Trip {
  return normalize({ ...t, items: [...t.items, { ...item, position: null }] });
}

/** Thay đổi cho phép khi sửa một mục. */
export type ItemPatch = Partial<Omit<TripItem, 'id' | 'placeId'>>;

/**
 * Sửa một mục. Đổi sang loại Nghỉ/Việc cần làm thì xóa chi phí, "đã bao gồm", giá tham khảo, đặt chỗ; bỏ "đã bao gồm" thì xóa giá tham
 * khảo (R4). Đổi ngày thì xuống cuối ngày mới; ngày cũ và ngày mới đều được đánh số lại 0..n-1.
 */
export function updateItem(t: Trip, itemId: string, patch: ItemPatch): Trip {
  const changedDay = patch.day !== undefined && t.items.find((i) => i.id === itemId)?.day !== patch.day;
  return normalize({
    ...t,
    items: t.items.map((i) => {
      if (i.id !== itemId) return i;
      const next: TripItem = { ...i, ...patch, position: changedDay ? null : (patch.position ?? i.position) };
      return isPlain(next.type) ? { ...next, costK: null, included: false, referenceK: null, booking: null } : { ...next, referenceK: next.included ? next.referenceK : null, booking: next.booking ?? 'pending' };
    }),
  });
}

/** Xếp một mục vào ngày (null = về "Chưa có ngày"); xuống cuối ngày. Chọn lại đúng ngày hiện tại thì không đổi gì. */
export function assignDay(t: Trip, itemId: string, day: string | null): Trip {
  return t.items.find((i) => i.id === itemId)?.day === day ? t : updateItem(t, itemId, { day });
}

/** Đổi chỗ một mục lên/xuống một vị trí trong ngày của nó; không đổi nếu đã ở biên. */
export function moveItem(t: Trip, itemId: string, dir: 'up' | 'down'): Trip {
  const item = t.items.find((i) => i.id === itemId);
  if (!item?.day) return t;
  const arr = dayItems(t, item.day);
  const q = arr.findIndex((i) => i.id === itemId);
  const r = dir === 'up' ? q - 1 : q + 1;
  if (r < 0 || r >= arr.length) return t;
  const order = arr.map((i) => i.id);
  [order[q], order[r]] = [order[r] as string, order[q] as string];
  return { ...t, items: t.items.map((i) => (i.day === item.day ? { ...i, position: order.indexOf(i.id) } : i)) };
}

/** Đánh dấu xong/chưa xong một việc cần làm (một người dùng ở Lát 1a). */
export function toggleDone(t: Trip, itemId: string): Trip {
  return { ...t, items: t.items.map((i) => (i.id === itemId && i.type === 'task' ? { ...i, done: !i.done } : i)) };
}

/** Kết quả gợi ý xếp ngày: mã mục → ngày và vị trí. */
export type DayPlan = Readonly<Record<string, { readonly day: string; readonly position: number }>>;

/** Áp dụng một gợi ý xếp ngày: chỉ cho mục đang "Chưa có ngày" và ngày thuộc chuyến (kế hoạch cũ/sai không ghi đè mục đã xếp). */
export function applyPlan(t: Trip, plan: DayPlan): Trip {
  const days = new Set(tripDays(t));
  return normalize({ ...t, items: t.items.map((i) => (i.day === null && plan[i.id] && days.has(plan[i.id]!.day) ? { ...i, day: plan[i.id]!.day, position: plan[i.id]!.position } : i)) });
}

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
