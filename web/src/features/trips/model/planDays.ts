import { airKm } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import { PLAN_DAYS as P } from './planDays.const.ts';
import type { Trip, TripItem } from './trip.types.ts';
import { dayItems, tripDays, unassignedItems } from './tripMath.ts';
import type { DayPlan } from './tripState.ts';

/** Một ngày trong bản xem trước: các mục sẽ thêm, tổng thời lượng đã biết và số mục thiếu thời lượng. */
export interface PlanDayPreview {
  readonly day: string;
  readonly itemIds: readonly string[];
  readonly knownMinutes: number;
  readonly unknownCount: number;
  readonly overloaded: boolean;
  readonly empty: boolean;
}

/** Kết quả gợi ý: kế hoạch để áp dụng cùng thông tin để giao diện nói thẳng các giới hạn. */
export interface PlanPreview {
  readonly plan: DayPlan;
  readonly days: readonly PlanDayPreview[];
  /** Các ngày vẫn trống sau khi xếp: không đủ nơi, KHÔNG kéo giãn lịch. */
  readonly emptyDays: readonly string[];
  /** Số mục được xếp mà không có thời lượng (xếp theo số lượng). */
  readonly unknownDuration: number;
}

type DurationOf = (placeId: string) => number | null;

/** Thời lượng tham quan của một mục: số phút người dùng nhập, rồi đến catalog; null nếu không có căn cứ. */
function visitMinutes(item: TripItem, durationOf: DurationOf): number | null {
  if (item.durationMin !== null) return item.durationMin;
  return item.placeId ? durationOf(item.placeId) : null;
}

/** Sắp thứ tự đi: từ mốc chính, luôn sang nơi gần nhất tiếp theo (đường chim bay); mục không tọa độ xếp cuối. KHÔNG phải tối ưu tuyến. */
function visitOrder(items: readonly TripItem[], coordOf: (placeId: string) => GeoPoint | null, hub: GeoPoint | null): TripItem[] {
  const pool = items.filter((i) => i.placeId && coordOf(i.placeId));
  const rest = items.filter((i) => !(i.placeId && coordOf(i.placeId)));
  const order: TripItem[] = [];
  let cur = hub;
  while (pool.length) {
    let best = 0;
    let bestD = Number.POSITIVE_INFINITY;
    pool.forEach((i, k) => {
      const d = cur ? airKm(cur, coordOf(i.placeId as string) as GeoPoint) : 0;
      if (d < bestD) { bestD = d; best = k; }
    });
    const next = pool.splice(best, 1)[0];
    if (!next) break;
    order.push(next);
    cur = coordOf(next.placeId as string);
  }
  return [...order, ...rest];
}

/**
 * Gợi ý xếp các mục "Chưa có ngày": đi theo thứ tự gần nhau, dồn vào một ngày cho tới khi hết sức chứa (thời lượng, hoặc trọng số khi thiếu thời lượng)
 * hoặc gặp một cụm xa hơn ngưỡng thì sang ngày kế. KHÔNG chia đều cho đủ mọi ngày: ngày không đủ nơi để trống và được báo trong `emptyDays`.
 * Không đụng tới mục đã có ngày; chỉ là gợi ý để người dùng chỉnh, không phải tối ưu tuyến.
 */
export function planPreview(t: Trip, coordOf: (placeId: string) => GeoPoint | null, hub: GeoPoint | null, durationOf: DurationOf = () => null): PlanPreview {
  const days = tripDays(t);
  const un = unassignedItems(t);
  if (!un.length || !days.length) return { plan: {}, days: [], emptyDays: [], unknownDuration: 0 };
  const weight = (i: TripItem): number => visitMinutes(i, durationOf) ?? (i.type === 'sightseeing' || i.type === 'tour' ? P.unknownVisitMin : 0);
  const load = days.map((d) => dayItems(t, d).reduce((s, i) => s + weight(i), 0));
  const counts = days.map((d) => dayItems(t, d).length);
  const last: (GeoPoint | null)[] = days.map((d) => {
    const placed = dayItems(t, d).flatMap((i) => (i.placeId && coordOf(i.placeId) ? [coordOf(i.placeId) as GeoPoint] : []));
    return placed[placed.length - 1] ?? null;
  });
  const plan: Record<string, { day: string; position: number }> = {};
  const planned = days.map(() => [] as string[]);
  const known = days.map(() => 0);
  const unknown = days.map(() => 0);
  let di = 0;
  for (const i of visitOrder(un, coordOf, hub)) {
    const w = weight(i);
    const p = i.placeId ? coordOf(i.placeId) : null;
    const full = (k: number): boolean => (load[k] ?? 0) > 0 && (load[k] ?? 0) + w > P.dayCapacityMin;
    const farFrom = (k: number): boolean => p !== null && last[k] !== null && airKm(last[k] as GeoPoint, p) > P.sameAreaKm;
    while (di < days.length - 1 && (full(di) || farFrom(di))) di += 1;
    plan[i.id] = { day: days[di] as string, position: counts[di] ?? 0 };
    counts[di] = (counts[di] ?? 0) + 1;
    load[di] = (load[di] ?? 0) + w;
    if (p) last[di] = p;
    planned[di]?.push(i.id);
    const minutes = visitMinutes(i, durationOf);
    if (minutes === null) unknown[di] = (unknown[di] ?? 0) + 1;
    else known[di] = (known[di] ?? 0) + minutes;
  }
  const preview: PlanDayPreview[] = days.map((day, k) => ({
    day, itemIds: planned[k] ?? [], knownMinutes: known[k] ?? 0, unknownCount: unknown[k] ?? 0,
    overloaded: (load[k] ?? 0) > P.dayCapacityMin && (planned[k]?.length ?? 0) > 0, empty: (counts[k] ?? 0) === 0,
  }));
  return { plan, days: preview, emptyDays: preview.filter((d) => d.empty).map((d) => d.day), unknownDuration: unknown.reduce((a, b) => a + b, 0) };
}

/** Giữ API cũ: chỉ lấy kế hoạch để áp dụng. */
export function planDays(t: Trip, coordOf: (placeId: string) => GeoPoint | null, hub: GeoPoint | null, durationOf: DurationOf = () => null): DayPlan {
  return planPreview(t, coordOf, hub, durationOf).plan;
}

/**
 * Áp lựa chọn đổi ngày của người dùng lên bản xem trước: mục bị đổi sang ngày khác nối đuôi ngày đó (sau các mục đã có và mục gợi ý).
 * Vị trí được đánh số lại liên tục trong từng ngày.
 */
export function withDayOverrides(t: Trip, plan: DayPlan, overrides: Readonly<Record<string, string>>): DayPlan {
  const result: Record<string, { day: string; position: number }> = {};
  const next = new Map<string, number>();
  const base = (day: string): number => next.get(day) ?? dayItems(t, day).length;
  const ids = Object.keys(plan).sort((a, b) => (plan[a]?.position ?? 0) - (plan[b]?.position ?? 0));
  for (const id of ids) {
    const day = overrides[id] ?? (plan[id]?.day as string);
    const position = base(day);
    next.set(day, position + 1);
    result[id] = { day, position };
  }
  return result;
}
