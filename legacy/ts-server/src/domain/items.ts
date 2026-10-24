// Mục trong lịch (D13, D16; R6; A-3…A-5, A-9, A-10). Thứ tự là thủ công; giờ và thời lượng tùy chọn.

export const ITEM_TYPES = [
  'sightseeing',
  'food',
  'transport',
  'lodging',
  'car_rental',
  'shopping',
  'tour',
  'rest',
  'task',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

/** Nhãn tiếng Việt cho 9 loại ở §7.2. */
export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  sightseeing: 'Tham quan',
  food: 'Ăn uống',
  transport: 'Di chuyển',
  lodging: 'Lưu trú',
  car_rental: 'Thuê xe',
  shopping: 'Mua sắm',
  tour: 'Tour/Combo',
  rest: 'Nghỉ',
  task: 'Việc cần làm',
};

export function isItemType(v: unknown): v is ItemType {
  return typeof v === 'string' && (ITEM_TYPES as readonly string[]).includes(v);
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_NOTE_LENGTH = 2000;
/** Thời lượng tối đa tính bằng phút (7 ngày). Mặc định của implementation. */
export const MAX_DURATION_MIN = 7 * 24 * 60;

export type FieldError = 'REQUIRED' | 'TOO_LONG' | 'MALFORMED' | 'OUT_OF_RANGE';

export function parseTitle(v: unknown): { ok: true; value: string } | { ok: false; error: FieldError } {
  if (typeof v !== 'string') return { ok: false, error: v === undefined || v === null ? 'REQUIRED' : 'MALFORMED' };
  const s = v.trim();
  if (s === '') return { ok: false, error: 'REQUIRED' };
  if (s.length > MAX_TITLE_LENGTH) return { ok: false, error: 'TOO_LONG' };
  return { ok: true, value: s };
}

export function parseNote(v: unknown): { ok: true; value: string | null } | { ok: false; error: FieldError } {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, error: 'MALFORMED' };
  const s = v.trim();
  if (s === '') return { ok: true, value: null };
  if (s.length > MAX_NOTE_LENGTH) return { ok: false, error: 'TOO_LONG' };
  return { ok: true, value: s };
}

/** Giờ tùy chọn, dạng "HH:MM" 24 giờ. Trống ⇒ null. */
export function parseTimeOfDay(v: unknown): { ok: true; value: string | null } | { ok: false; error: FieldError } {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, error: 'MALFORMED' };
  const s = v.trim();
  if (s === '') return { ok: true, value: null };
  const m = /^(\d{2}):(\d{2})$/.exec(s);
  if (!m) return { ok: false, error: 'MALFORMED' };
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return { ok: false, error: 'OUT_OF_RANGE' };
  return { ok: true, value: s };
}

/** Thời lượng tùy chọn, số nguyên phút ≥ 0. Giờ + thời lượng vượt nửa đêm vẫn hợp lệ (mặc định cho Q18(b)). */
export function parseDurationMin(v: unknown): { ok: true; value: number | null } | { ok: false; error: FieldError } {
  if (v === undefined || v === null || v === '') return { ok: true, value: null };
  let n: number;
  if (typeof v === 'number') n = v;
  else if (typeof v === 'string' && /^\d+$/.test(v.trim())) n = Number(v.trim());
  else return { ok: false, error: 'MALFORMED' };
  if (!Number.isInteger(n)) return { ok: false, error: 'MALFORMED' };
  if (n < 0 || n > MAX_DURATION_MIN) return { ok: false, error: 'OUT_OF_RANGE' };
  return { ok: true, value: n };
}

/**
 * Sắp xếp thủ công (D16). `current` là thứ tự hiện tại các mục còn hiện trong ngày;
 * `ordered` phải là một hoán vị của `current`. Đổi giờ không tự sắp xếp lại.
 */
export function validateReorder(current: readonly string[], ordered: readonly string[]): boolean {
  if (current.length !== ordered.length) return false;
  const a = new Set(current);
  const b = new Set(ordered);
  if (a.size !== current.length || b.size !== ordered.length) return false;
  for (const id of ordered) if (!a.has(id)) return false;
  return true;
}

/** Chèn `id` vào `ids` tại `index` (kẹp vào [0, length]). Dùng khi thêm, chuyển ngày, khôi phục. */
export function insertAt(ids: readonly string[], id: string, index: number): string[] {
  const out = ids.filter((x) => x !== id);
  const i = Math.max(0, Math.min(index, out.length));
  out.splice(i, 0, id);
  return out;
}
