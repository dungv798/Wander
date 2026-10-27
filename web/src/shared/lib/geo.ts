import { COPY } from '../const/copy.vi.ts';

/** Tọa độ địa lý (độ). */
export interface GeoPoint {
  readonly lat: number;
  readonly lon: number;
}

/** Hệ số quanh co của đường núi nhân với đường chim bay; GIẢ ĐỊNH chưa kiểm chứng, khớp `TravelEstimate` của backend. */
export const ROAD_FACTOR = 1.5;
/** Tốc độ xe máy giả định (km/h), khớp backend. */
export const SPEED_KMH = 25;

const EARTH_RADIUS_KM = 6371;
const HALF = 2;
const MINUTES_PER_HOUR = 60;
const HALF_TURN_DEG = 180;
const DEG_TO_RAD = Math.PI / HALF_TURN_DEG;

/** Khoảng cách chim bay (haversine) giữa hai điểm, đơn vị km. */
export function airKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLon = (b.lon - a.lon) * DEG_TO_RAD;
  const h = Math.sin(dLat / HALF) ** HALF + Math.cos(a.lat * DEG_TO_RAD) * Math.cos(b.lat * DEG_TO_RAD) * Math.sin(dLon / HALF) ** HALF;
  return EARTH_RADIUS_KM * HALF * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Ước tính đường bộ giữa hai điểm: km (tối thiểu 1) và phút đi xe máy. KHÔNG phải chỉ đường; giao diện luôn ghi "ước tính". */
export function travelEstimate(a: GeoPoint, b: GeoPoint): { km: number; minutes: number } {
  const road = airKm(a, b) * ROAD_FACTOR;
  return { km: Math.max(1, Math.round(road)), minutes: Math.round((road / SPEED_KMH) * MINUTES_PER_HOUR) };
}

/** Quãng đường bộ ước tính (km, chưa làm tròn) giữa hai điểm: chim bay × hệ số đường núi. */
export function roadKmBetween(a: GeoPoint, b: GeoPoint): number {
  return airKm(a, b) * ROAD_FACTOR;
}

/** Số phút đi xe máy cho một quãng đường (km) theo tốc độ giả định. */
export function minutesForKm(km: number): number {
  return (km / SPEED_KMH) * MINUTES_PER_HOUR;
}

const QUARTER_HOUR_MIN = 15;
const HALF_HOUR_MIN = 30;

/**
 * Thời gian đi dạng dễ đọc từ số phút: dưới 1 giờ làm tròn 15 phút ("45 phút", tối thiểu 15); từ 1 giờ làm tròn nửa giờ ("2 giờ", "2,5 giờ").
 * Đây là con số ước tính; giao diện luôn ghi "ước tính".
 */
export function formatTravelTime(minutes: number): string {
  const quarter = Math.round(minutes / QUARTER_HOUR_MIN) * QUARTER_HOUR_MIN;
  if (quarter < MINUTES_PER_HOUR) return `${Math.max(QUARTER_HOUR_MIN, quarter)} ${COPY.time.minutes}`;
  const half = Math.round(minutes / HALF_HOUR_MIN) * HALF_HOUR_MIN;
  const hours = Math.floor(half / MINUTES_PER_HOUR);
  return `${hours}${half % MINUTES_PER_HOUR ? COPY.time.halfHourSuffix : ''} ${COPY.time.hours}`;
}
