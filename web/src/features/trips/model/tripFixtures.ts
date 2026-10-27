// Chỉ dùng trong test: dựng nhanh một `Trip` trong bộ nhớ (máy chủ mới là nơi thật sự lưu và đánh số thứ tự).
import { PLACE_KIND } from './trip.const.ts';
import type { ItemKind, Trip, TripItem, TripsState } from './trip.types.ts';
import { normalize } from './tripState.ts';
import type { ItemPatch, NewTrip, PlaceRef } from './tripState.ts';

type IdSource = () => string;

/** Kho rỗng. */
export const S0: TripsState = { trips: [] };

/** Mục từ địa điểm trong kho: chưa có ngày, loại suy ra từ loại địa điểm, chưa biết giá. */
function placeItem(place: PlaceRef, id: IdSource): TripItem {
  return { id: id(), placeId: place.id, type: PLACE_KIND[place.category] ?? 'sightseeing', title: '', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false };
}

/** Mục tự do (Nghỉ/Việc cần làm không có đặt chỗ). */
export function freeItem(type: ItemKind, title: string, id: IdSource): TripItem {
  const plain = type === 'rest' || type === 'task';
  return { id: id(), placeId: null, type, title, day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: plain ? null : 'pending', done: false };
}

/** Thêm chuyến vào kho với các địa điểm đã chọn (mục chưa có ngày). */
export function createTrip(s: TripsState, n: NewTrip, places: readonly PlaceRef[], id: IdSource, now = 1): { state: TripsState; trip: Trip } {
  const trip: Trip = {
    id: id(), name: n.name, destinationId: n.destinationId, startDate: n.startDate, endDate: n.endDate, datesTentative: n.datesTentative ?? false, kind: n.kind ?? null,
    interests: n.interests ?? [], styles: n.styles ?? [], pace: n.pace ?? null, budgetK: n.budgetK ?? null, items: places.map((p) => placeItem(p, id)), trash: [], createdAt: now,
  };
  return { state: { trips: [...s.trips, trip] }, trip };
}

/** Thêm một mục vào cuối ngày của nó và đánh số lại. */
export function addItem(t: Trip, item: TripItem): Trip {
  return normalize({ ...t, items: [...t.items, item] });
}

/** Sửa các trường của một mục. */
export function updateItem(t: Trip, itemId: string, patch: ItemPatch): Trip {
  return normalize({ ...t, items: t.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) });
}

/** Gán ngày cho một mục (xuống cuối ngày đó). */
export function assignDay(t: Trip, itemId: string, day: string | null): Trip {
  const next = t.items.map((i) => (i.id === itemId ? { ...i, day, position: day === null ? null : Number.MAX_SAFE_INTEGER } : i));
  return normalize({ ...t, items: next });
}
