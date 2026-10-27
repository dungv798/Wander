import { LIMITS } from '../../../shared/const/limits.const.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import type { TrashEntry, Trip } from './trip.types.ts';
import { normalize } from './tripState.ts';
import { tripDays } from './tripMath.ts';

/** Kết quả khôi phục một mục: chuyến mới và việc mục có về đúng ngày cũ hay phải vào "Chưa có ngày". */
export interface RestoreResult {
  readonly trip: Trip;
  /** true khi ngày cũ không còn trong chuyến (đã sửa ngày đi/về) nên mục về "Chưa có ngày". */
  readonly dayLost: boolean;
}

/** Thùng rác đã đầy (không tự xóa mục cũ: giữ đến khi người dùng xóa vĩnh viễn, D19). */
export function trashFull(t: Pick<Trip, 'trash'>): boolean {
  return t.trash.length >= LIMITS.MAX_TRASH;
}

/** Khôi phục mục này sẽ tạo bản thứ hai của một địa điểm đã có trong chuyến (mỗi địa điểm chỉ một lần). */
export function isDuplicateRestore(t: Pick<Trip, 'items'>, entry: TrashEntry): boolean {
  return entry.item.placeId !== null && t.items.some((i) => i.placeId === entry.item.placeId);
}

/** Xóa mềm một mục: đưa vào "Đã xóa gần đây" (mới nhất đứng đầu), nhớ ngày và vị trí; ngày cũ được đánh số lại 0..n-1. Mục không có hoặc thùng rác đã đầy thì trả nguyên chuyến. */
export function trashItem(t: Trip, itemId: string, entryId: string, now: number): Trip {
  const item = t.items.find((i) => i.id === itemId);
  if (!item || trashFull(t)) return t;
  const entry: TrashEntry = { id: entryId, item, deletedAt: now, day: item.day, position: item.position };
  return normalize({ ...t, items: t.items.filter((i) => i.id !== itemId), trash: [entry, ...t.trash] });
}

/**
 * Khôi phục một mục từ "Đã xóa gần đây" về đúng ngày và vị trí cũ (Trip.restore của backend). Ngày cũ không còn trong chuyến thì
 * về "Chưa có ngày" và `dayLost` báo để nói rõ lý do. Không có mục, hoặc khôi phục sẽ trùng địa điểm đã có, thì trả null (giữ nguyên thùng rác).
 */
export function restoreItem(t: Trip, entryId: string): RestoreResult | null {
  const entry = t.trash.find((e) => e.id === entryId);
  if (!entry || isDuplicateRestore(t, entry)) return null;
  const back = entry.day && tripDays(t).includes(entry.day) ? entry.day : null;
  const at = entry.position ?? Number.MAX_SAFE_INTEGER;
  const shifted = t.items.map((i) => (back && i.day === back && i.position !== null && i.position >= at ? { ...i, position: i.position + 1 } : i));
  const item = { ...entry.item, day: back, position: back ? entry.position : null };
  const trip = normalize({ ...t, items: [...shifted, item], trash: t.trash.filter((e) => e.id !== entryId) });
  return { trip, dayLost: entry.day !== null && back === null };
}

/** Xóa vĩnh viễn một mục khỏi "Đã xóa gần đây" (không hoàn tác được). */
export function purgeItem(t: Trip, entryId: string): Trip {
  return { ...t, trash: t.trash.filter((e) => e.id !== entryId) };
}

export { agoText };
