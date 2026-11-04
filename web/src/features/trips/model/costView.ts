import { KIND_ORDER } from './trip.const.ts';
import type { ItemKind, TripItem } from './trip.types.ts';
import { isPlain } from './tripMath.ts';

/** Cách nhóm chi phí trong tờ chi tiết. */
export type CostGrouping = 'day' | 'kind';

/** Một nhóm khoản chi: tổng đã biết, số mục chưa biết giá và các mục (để mở sửa). */
export interface CostGroup {
  /** Ngày ('' = chưa có ngày) hoặc mã loại. */
  readonly key: string;
  readonly items: readonly TripItem[];
  /** Tổng nghìn đồng của mục đã biết giá, không tính "đã bao gồm". */
  readonly knownK: number;
  readonly knownCount: number;
  readonly unknownCount: number;
  readonly includedCount: number;
}

/** Tạo nhóm từ danh sách mục: trống = chưa biết, 0 = biết bằng không, "đã bao gồm" không cộng (D17/D18). */
function toGroup(key: string, items: readonly TripItem[]): CostGroup {
  let knownK = 0;
  let knownCount = 0;
  let unknownCount = 0;
  let includedCount = 0;
  for (const i of items) {
    if (i.included) includedCount += 1;
    else if (i.costK === null) unknownCount += 1;
    else { knownCount += 1; knownK += i.costK; }
  }
  return { key, items, knownK, knownCount, unknownCount, includedCount };
}

/**
 * Gom các mục có thể có giá (bỏ Nghỉ/Việc cần làm) theo ngày hoặc theo loại. Theo ngày: đúng thứ tự ngày của chuyến, "chưa có ngày" (khóa '') ở cuối.
 * Theo loại: thứ tự cố định của `KIND_ORDER`. Nhóm rỗng không xuất hiện.
 */
export function groupCosts(items: readonly TripItem[], by: CostGrouping, days: readonly string[]): CostGroup[] {
  const priced = items.filter((i) => !isPlain(i.type));
  if (by === 'kind') {
    return KIND_ORDER.flatMap((k: ItemKind) => {
      const mine = priced.filter((i) => i.type === k);
      return mine.length ? [toGroup(k, mine)] : [];
    });
  }
  const keys = [...days, ''];
  return keys.flatMap((d) => {
    const mine = priced.filter((i) => (i.day ?? '') === d);
    return mine.length ? [toGroup(d, mine)] : [];
  });
}
