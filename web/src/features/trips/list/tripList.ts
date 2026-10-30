import { normalizeSearch } from '../../../shared/lib/text.ts';

export const TRIP_STATUSES = ['upcoming', 'ongoing', 'past', 'tentative'] as const;
export const TRIP_SORTS = ['departure', 'created', 'name'] as const;
export type TripStatus = typeof TRIP_STATUSES[number];
export type TripSort = typeof TRIP_SORTS[number];
export interface TripListEntry {
  readonly id: string;
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly datesTentative: boolean;
  readonly createdAt: number;
}
export interface TripListOptions {
  readonly query: string;
  readonly status: TripStatus | null;
  readonly sort: TripSort;
}

/** Phân nhóm theo ngày địa phương yyyy-mm-dd; ngày chưa chốt luôn là một nhóm riêng. */
export function tripStatus(trip: TripListEntry, today: string): TripStatus {
  if (trip.datesTentative || !trip.startDate || !trip.endDate) return 'tentative';
  if (trip.endDate < today) return 'past';
  return trip.startDate > today ? 'upcoming' : 'ongoing';
}

/** Đếm toàn bộ chuyến theo trạng thái, độc lập ô tìm để chip không đổi nghĩa khi gõ. */
export function countTripStatuses(trips: readonly TripListEntry[], today: string): Record<TripStatus, number> {
  const counts = { upcoming: 0, ongoing: 0, past: 0, tentative: 0 };
  for (const trip of trips) counts[tripStatus(trip, today)]++;
  return counts;
}

/** Tìm không dấu theo tên/điểm đến và sắp ổn định bằng mã khi trùng ngày, tên hoặc thời điểm tạo. */
export function selectTrips<T extends TripListEntry>(trips: readonly T[], options: TripListOptions, today: string, destinations: Readonly<Record<string, string>> = {}): T[] {
  const query = normalizeSearch(options.query);
  return trips.filter(t => (!options.status || tripStatus(t, today) === options.status) && normalizeSearch(`${t.name} ${destinations[t.destinationId] ?? t.destinationId}`).includes(query)).sort((a, b) => {
    let order: number;
    if (options.sort === 'name') order = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
    else if (options.sort === 'created') order = b.createdAt - a.createdAt;
    else {
      const left = tripStatus(a, today) === 'tentative' ? null : a.startDate;
      const right = tripStatus(b, today) === 'tentative' ? null : b.startDate;
      order = left === right ? 0 : left === null ? 1 : right === null ? -1 : left.localeCompare(right);
    }
    return order || b.createdAt - a.createdAt || a.id.localeCompare(b.id);
  });
}
