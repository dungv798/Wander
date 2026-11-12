import { COPY } from '../const/copy.vi.ts';
import { DISTANCE_COPY } from '../const/distance.copy.ts';
import { fill } from '../const/copy.vi.ts';

/** A distance under one km keeps its own label so it is not rounded to 0 km. */
export function formatTravelDistance(km: number): string {
  return km < 1 ? DISTANCE_COPY.underOne : fill(DISTANCE_COPY.kilometers, { km: Math.round(km) });
}

/** Geographic coordinates (degrees). */
export interface GeoPoint {
  readonly lat: number;
  readonly lon: number;
}

/** The winding factor of a mountain road multiplied with the straight-line distance; an UNVERIFIED ASSUMPTION, matching the backend's `TravelEstimate`. */
export const ROAD_FACTOR = 1.5;
/** The assumed motorbike speed (km/h), matching the backend. */
export const SPEED_KMH = 25;

const EARTH_RADIUS_KM = 6371;
const HALF = 2;
const MINUTES_PER_HOUR = 60;
const HALF_TURN_DEG = 180;
const DEG_TO_RAD = Math.PI / HALF_TURN_DEG;

/** The straight-line distance (haversine) between two points, in km. */
export function airKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLon = (b.lon - a.lon) * DEG_TO_RAD;
  const h = Math.sin(dLat / HALF) ** HALF + Math.cos(a.lat * DEG_TO_RAD) * Math.cos(b.lat * DEG_TO_RAD) * Math.sin(dLon / HALF) ** HALF;
  return EARTH_RADIUS_KM * HALF * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** A road estimate between two points: km (at least 1) and motorbike minutes. NOT directions; the UI always says 'estimate'. */
export function travelEstimate(a: GeoPoint, b: GeoPoint): { km: number; minutes: number } {
  const road = airKm(a, b) * ROAD_FACTOR;
  return { km: Math.max(1, Math.round(road)), minutes: Math.round((road / SPEED_KMH) * MINUTES_PER_HOUR) };
}

/** The estimated road distance (km, unrounded) between two points: straight line x the mountain-road factor. */
export function roadKmBetween(a: GeoPoint, b: GeoPoint): number {
  return airKm(a, b) * ROAD_FACTOR;
}

/** The motorbike minutes for a distance (km) at the assumed speed. */
export function minutesForKm(km: number): number {
  return (km / SPEED_KMH) * MINUTES_PER_HOUR;
}

const QUARTER_HOUR_MIN = 15;
const HALF_HOUR_MIN = 30;

/**
 * The travel minutes rounded for DISPLAY: under 1 hour rounds to 15 minutes (at least 15); from 1 hour rounds to a half hour.
 * One single method for each leg and for the total, so the total always matches the legs below it.
 */
export function roundTravelMinutes(minutes: number): number {
  const quarter = Math.round(minutes / QUARTER_HOUR_MIN) * QUARTER_HOUR_MIN;
  if (quarter < MINUTES_PER_HOUR) return Math.max(QUARTER_HOUR_MIN, quarter);
  return Math.round(minutes / HALF_HOUR_MIN) * HALF_HOUR_MIN;
}

/** The sum of the legs already rounded for display; it is not rounded again from the total km. */
export function sumRoundedMinutes(legMinutes: readonly number[]): number {
  return legMinutes.reduce((sum, m) => sum + roundTravelMinutes(m), 0);
}

/** The ALREADY rounded minutes as exact text: '45 minutes', '2 hours', '2 hours 15 minutes'. Used for the sum of the legs. */
export function formatTravelMinutes(minutes: number): string {
  if (minutes < MINUTES_PER_HOUR) return `${minutes} ${COPY.time.minutes}`;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  return rest ? `${hours} ${COPY.time.hours} ${rest} ${COPY.time.minutes}` : `${hours} ${COPY.time.hours}`;
}

/**
 * A readable travel time for ONE leg: under 1 hour rounds to 15 minutes ('45 minutes', at least 15); from 1 hour rounds to a half hour ('2 hours', '2.5 hours').
 * This is an estimated number; the UI always says 'estimate'.
 */
export function formatTravelTime(minutes: number): string {
  const rounded = roundTravelMinutes(minutes);
  if (rounded < MINUTES_PER_HOUR) return `${rounded} ${COPY.time.minutes}`;
  const hours = Math.floor(rounded / MINUTES_PER_HOUR);
  return `${hours}${rounded % MINUTES_PER_HOUR ? COPY.time.halfHourSuffix : ''} ${COPY.time.hours}`;
}
