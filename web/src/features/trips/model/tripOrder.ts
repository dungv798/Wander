import type { Trip, TripsState } from './trip.types.ts';

/** Sắp xếp danh sách chuyến như máy chủ (`startDate` mới nhất trước, bằng nhau thì tạo sau trước) để thứ tự trong phiên khớp sau khi tải lại. */
export function sortTrips(trips: readonly Trip[]): Trip[] {
  return [...trips].sort((a, b) => (a.startDate === b.startDate ? b.createdAt - a.createdAt : a.startDate < b.startDate ? 1 : -1));
}

/**
 * Hợp nhất bản nạp cả danh sách (`loaded`, bắt đầu từ lúc kho là `started`) với kho hiện tại (`current`) sau khi có thao tác ghi xen giữa:
 * chuyến đã được đọc lại sau lúc `started` (hoặc mới tạo) giữ bản trong kho vì nó mới hơn; chuyến còn lại lấy từ bản nạp. Chuyến đã có ở
 * `started` mà không còn trong `loaded` (bị xóa ở máy khác) thì bỏ.
 */
export function mergeLoaded(started: TripsState, current: TripsState, loaded: readonly Trip[]): Trip[] {
  const startedById = new Map(started.trips.map((t) => [t.id, t]));
  const newer = new Map(current.trips.filter((t) => startedById.get(t.id) !== t).map((t) => [t.id, t]));
  const merged = loaded.map((t) => newer.get(t.id) ?? t);
  const known = new Set(loaded.map((t) => t.id));
  for (const t of newer.values()) if (!known.has(t.id) && !startedById.has(t.id)) merged.push(t);
  return sortTrips(merged);
}
