import { formatVnd } from '../../../shared/domain/Money.ts';
import { FORMAT } from '../../../shared/const/format.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { TRIPS_COPY as T } from './trips.copy.ts';
import { DateRange } from '../../../shared/domain/DateRange.ts';
import { ROAD_FACTOR, airKm } from '../../../shared/lib/geo.ts';
import type { GeoPoint } from '../../../shared/lib/geo.ts';
import { ITEM_KINDS } from './trip.const.ts';
import type { ItemKind, Trip, TripItem } from './trip.types.ts';

/** Mọi ngày `yyyy-mm-dd` của chuyến, gồm hai đầu (R5). */
export function tripDays(t: Pick<Trip, 'startDate' | 'endDate'>): string[] {
  return DateRange.of(t.startDate, t.endDate).days();
}

/** Loại mục không có giá và không đặt chỗ (Nghỉ, Việc cần làm). */
export function isPlain(kind: ItemKind): boolean {
  return ITEM_KINDS[kind].plain;
}

/** Các mục của một ngày theo thứ tự `position` (mục chưa có thứ tự xếp cuối, giữ thứ tự thêm vào). */
export function dayItems(t: Pick<Trip, 'items'>, day: string): TripItem[] {
  return t.items
    .map((it, index) => ({ it, index }))
    .filter((x) => x.it.day === day)
    .sort((a, b) => (a.it.position ?? Number.MAX_SAFE_INTEGER) - (b.it.position ?? Number.MAX_SAFE_INTEGER) || a.index - b.index)
    .map((x) => x.it);
}

/** Các mục "Chưa có ngày". */
export function unassignedItems(t: Pick<Trip, 'items'>): TripItem[] {
  return t.items.filter((i) => i.day === null);
}

/** Tổng hợp chi phí của chuyến (D17/D18). Mọi số là nghìn đồng. */
export interface CostSummary {
  /** "Tổng phải trả thêm": chỉ cộng mục đã biết giá và KHÔNG "đã bao gồm". */
  readonly totalK: number;
  readonly knownCount: number;
  /** Số mục có giá nhưng chưa biết giá (ô trống), không tính mục "đã bao gồm". */
  readonly unknownCount: number;
  readonly includedCount: number;
  readonly booked: number;
  /** Số mục có thể đặt chỗ (loại có giá). */
  readonly bookable: number;
  readonly byKind: Readonly<Partial<Record<ItemKind, number>>>;
  readonly byDayK: Readonly<Record<string, number>>;
  readonly unknownByDay: Readonly<Record<string, number>>;
}

/** Tính chi phí theo quy tắc: trống = chưa biết; 0 = biết bằng không; "đã bao gồm" không cộng; Nghỉ/Việc cần làm không có giá. */
export function summarizeCosts(t: Pick<Trip, 'items'>): CostSummary {
  let totalK = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let includedCount = 0;
  let booked = 0;
  let bookable = 0;
  const byKind: Partial<Record<ItemKind, number>> = {};
  const byDayK: Record<string, number> = {};
  const unknownByDay: Record<string, number> = {};
  for (const i of t.items) {
    if (isPlain(i.type)) continue;
    bookable += 1;
    if (i.booking === 'booked') booked += 1;
    if (i.included) {
      includedCount += 1;
      continue;
    }
    if (i.costK === null) {
      unknownCount += 1;
      if (i.day) unknownByDay[i.day] = (unknownByDay[i.day] ?? 0) + 1;
      continue;
    }
    knownCount += 1;
    totalK += i.costK;
    byKind[i.type] = (byKind[i.type] ?? 0) + i.costK;
    if (i.day) byDayK[i.day] = (byDayK[i.day] ?? 0) + i.costK;
  }
  return { totalK, knownCount, unknownCount, includedCount, booked, bookable, byKind, byDayK, unknownByDay };
}

/** So sánh ngân sách với "tổng phải trả thêm". */
export interface BudgetStatus {
  readonly budgetK: number;
  readonly leftK: number;
  readonly over: boolean;
  /** Phần trăm đã dùng, kẹp 0..100 (ngân sách 0 mà có chi thì 100). */
  readonly pct: number;
}

const PERCENT = 100;

/** Trạng thái ngân sách; null nếu chưa đặt ngân sách. */
export function budgetStatus(budgetK: number | null, totalK: number): BudgetStatus | null {
  if (budgetK === null) return null;
  const leftK = budgetK - totalK;
  const pct = budgetK ? Math.min(PERCENT, Math.round((totalK / budgetK) * PERCENT)) : PERCENT;
  return { budgetK, leftK, over: leftK < 0, pct };
}

/** Quãng đường ước tính (km, đường núi = chim bay × hệ số) cộng dồn qua các mục có tọa độ liền nhau; mục không tọa độ bị bỏ qua. */
export function roadKm(items: readonly TripItem[], coordOf: (placeId: string) => GeoPoint | null): number {
  let sum = 0;
  let last: GeoPoint | null = null;
  for (const i of items) {
    const p = i.placeId ? coordOf(i.placeId) : null;
    if (!p) continue;
    if (last) sum += airKm(last, p) * ROAD_FACTOR;
    last = p;
  }
  return sum;
}

/** Số mục là địa điểm trong kho. */
export function placeCount(t: Pick<Trip, 'items'>): number {
  return t.items.filter((i) => i.placeId !== null).length;
}

/** Diễn đạt độ đầy đủ của giá; số 0 chỉ hiện khi có giá đã nhập, không tính mục đã bao gồm. */
export function costSummaryText(costs: Pick<CostSummary, 'knownCount' | 'totalK' | 'unknownCount'>): string {
  if (!costs.knownCount) return T.cost.noneKnown;
  const amount = formatVnd(costs.totalK * FORMAT.VND_PER_THOUSAND);
  return fill(costs.unknownCount ? T.cost.partial : T.cost.known, { money: amount, n: costs.unknownCount });
}
