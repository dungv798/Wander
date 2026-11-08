import { minutesForKm, roadKmBetween } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import type { TripItem } from './trip.types.ts';
import type { CoordinateOf, DurationOf } from './planDays.types.ts';
import { PLAN_DAYS as P } from './planDays.const.ts';

/** Ưu tiên số phút người dùng nhập; giá trị thiếu không được đổi thành thời lượng thật. */
export function visitMinutes(item: TripItem, durationOf: DurationOf): number | null {
  return item.durationMin ?? (item.placeId ? durationOf(item.placeId) : null);
}

/** Trọng số chỉ để đề nghị, mọi loại mục thiếu thời lượng đều chiếm chỗ trong ngày. */
export function planningWeight(item: TripItem, durationOf: DurationOf): number {
  return visitMinutes(item, durationOf) ?? P.unknownByKind[item.type];
}

/** Chỉ nhận tọa độ hữu hạn; không dùng (0,0) để thay một địa điểm chưa biết. */
export function itemPoint(item: TripItem, coordinateOf: CoordinateOf): GeoPoint | null {
  // Quy ước catalog: exp-* là ý tưởng có mốc khu vực, chưa phải quán/điểm hẹn chính xác để hứa gom gần nhau.
  if (item.placeId?.startsWith('exp-')) return null;
  const point = item.placeId ? coordinateOf(item.placeId) : null;
  return point && Number.isFinite(point.lat) && Number.isFinite(point.lon) ? point : null;
}

/** Phút liên điểm chưa làm tròn, dùng đúng hệ số đường/tốc độ đã có của app; null là chưa biết chặng. */
export function planningTravel(from: GeoPoint | null, to: GeoPoint | null): number | null {
  return from && to ? minutesForKm(roadKmBetween(from, to)) : null;
}

/** Một hoạt động dài có thể đứng riêng trọn ngày, vẫn phải chừa chỗ cho đường đi trong trần 8 giờ giả định. */
export function planningCapacity(items: readonly TripItem[], durationOf: DurationOf): number {
  const only = items.length === 1 ? items[0] : undefined;
  const duration = only ? visitMinutes(only, durationOf) : null;
  return duration !== null && duration > P.dayCapacityMin && duration <= P.fullDayMin ? P.fullDayMin : P.dayCapacityMin;
}
