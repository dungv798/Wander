import { LIMITS } from '../../../shared/const/limits.const.ts';
import { agoText } from '../../../shared/lib/agoText.ts';
import type { TrashEntry, Trip } from './trip.types.ts';

/** Thùng rác đã đầy (không tự xóa mục cũ: giữ đến khi người dùng xóa vĩnh viễn, D19). */
export function trashFull(t: Pick<Trip, 'trash'>): boolean {
  return t.trash.length >= LIMITS.MAX_TRASH;
}

/** Khôi phục mục này sẽ tạo bản thứ hai của một địa điểm đã có trong chuyến (mỗi địa điểm chỉ một lần). */
export function isDuplicateRestore(t: Pick<Trip, 'items'>, entry: TrashEntry): boolean {
  return entry.item.placeId !== null && t.items.some((i) => i.placeId === entry.item.placeId);
}

export { agoText };
