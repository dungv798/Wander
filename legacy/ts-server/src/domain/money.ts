// Chi phí (D9, D17, D18; R2–R4). Đơn vị lưu và nhập: nghìn đồng VND, số nguyên không âm.
// Trống (null) = chưa biết; 0 = đã biết bằng 0; "đã bao gồm" không cộng vào tổng phải trả thêm.

/** Giá trị tối đa (nghìn đồng). Mặc định của implementation cho Q18(d); đổi được. */
export const MAX_COST_K = 1_000_000_000;

export type CostError = 'NEGATIVE' | 'MALFORMED' | 'TOO_LARGE';

export type CostParse =
  | { ok: true; value: number | null }
  | { ok: false; error: CostError };

export function parseCostK(input: unknown): CostParse {
  if (input === null || input === undefined) return { ok: true, value: null };

  if (typeof input === 'number') {
    if (!Number.isFinite(input) || !Number.isInteger(input)) return { ok: false, error: 'MALFORMED' };
    if (input < 0) return { ok: false, error: 'NEGATIVE' };
    if (input > MAX_COST_K) return { ok: false, error: 'TOO_LARGE' };
    return { ok: true, value: input };
  }

  if (typeof input === 'string') {
    const s = input.trim();
    if (s === '') return { ok: true, value: null };
    if (/^-\d+$/.test(s)) return { ok: false, error: 'NEGATIVE' };
    // Chỉ chữ số. Số thập phân, dấu phân cách, ký hiệu tiền tệ đều là định dạng sai (D17).
    if (!/^\d+$/.test(s)) return { ok: false, error: 'MALFORMED' };
    if (s.replace(/^0+(?=\d)/, '').length > 10) return { ok: false, error: 'TOO_LARGE' };
    const n = Number(s);
    if (n > MAX_COST_K) return { ok: false, error: 'TOO_LARGE' };
    return { ok: true, value: n };
  }

  return { ok: false, error: 'MALFORMED' };
}

/** Hiển thị VND đầy đủ, ví dụ 1500 → "1.500.000 ₫" (D17). */
export function formatVndFromK(k: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(k * 1000)} ₫`;
}

export interface CostFields {
  costK: number | null;
  included: boolean;
  referenceK: number | null;
}

export interface CountableItem extends CostFields {
  deletedAt: string | null;
}

/**
 * Tổng phải trả thêm (R2). Cộng chi phí số của mục còn hiện; không cộng mục đã xóa,
 * mục "đã bao gồm" (kể cả giá tham khảo) và mục chưa biết (trống).
 */
export function totalExtraK(items: readonly CountableItem[]): number {
  let sum = 0;
  for (const it of items) sum += countedCostK(it);
  return sum;
}

/** Phần chi phí của một mục được tính vào tổng (R2): 0 nếu đã xóa, đã bao gồm hoặc chưa biết. */
export function countedCostK(it: CountableItem): number {
  if (it.deletedAt !== null || it.included || it.costK === null) return 0;
  return it.costK;
}

/** Tổng theo nhóm (ngày, loại…) với cùng quy tắc loại trừ như tổng chung (A-13); tổng các nhóm luôn bằng tổng chung. */
export function totalsByKey<T extends CountableItem>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const out = new Map<string, number>();
  for (const it of items) out.set(key(it), (out.get(key(it)) ?? 0) + countedCostK(it));
  return out;
}

export type CostFieldsError =
  | { field: 'cost' | 'referenceCost'; code: CostError }
  | { field: 'referenceCost'; code: 'REFERENCE_REQUIRES_INCLUDED' };

/**
 * Gộp và kiểm tra ba trường chi phí. Mặc định cho Q18(f): vừa có chi phí vừa tick "đã bao gồm" được phép
 * (dữ liệu giữ nguyên, tổng bỏ qua mục đã bao gồm); giá tham khảo chỉ hợp lệ khi đã tick.
 */
export function buildCostFields(
  cost: unknown,
  included: boolean,
  referenceCost: unknown,
): { ok: true; value: CostFields } | { ok: false; error: CostFieldsError } {
  const c = parseCostK(cost);
  if (!c.ok) return { ok: false, error: { field: 'cost', code: c.error } };
  const r = parseCostK(referenceCost);
  if (!r.ok) return { ok: false, error: { field: 'referenceCost', code: r.error } };
  if (!included && r.value !== null) {
    return { ok: false, error: { field: 'referenceCost', code: 'REFERENCE_REQUIRES_INCLUDED' } };
  }
  return { ok: true, value: { costK: c.value, included, referenceK: r.value } };
}
