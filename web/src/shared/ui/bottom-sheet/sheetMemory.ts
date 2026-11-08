import { PersistentStore } from '../../state/PersistentStore.ts';
import { SHEET_HINT, SHEET_ROUTE_PARTS } from './bottomSheet.const.ts';
import type { Snap } from './bottomSheet.const.ts';

const snaps = new Map<string, Snap>();

/** Giữ nấc theo màn/chuyến trong phiên, bỏ phần tab cuối URL để đổi ngày không thu tờ. */
export function sheetMemoryKey(hash: string): string {
  return hash.split('/').slice(0, SHEET_ROUTE_PARTS).join('/');
}

/** Đọc nấc từng dùng trong phiên; màn mới vẫn dùng nấc mặc định của nơi gọi. */
export function rememberedSnap(key: string, fallback: Snap): Snap { return snaps.get(key) ?? fallback; }

/** Ghi nấc sau mỗi lần thay đổi, không cần ghi thông tin chuyến xuống thiết bị. */
export function rememberSnap(key: string, snap: Snap): void { snaps.set(key, snap); }

/** Storage bị chặn vẫn hiện lời mời kéo và không làm hỏng màn lịch. */
export function shouldShowSheetHint(storage?: Pick<Storage, 'getItem'>): boolean {
  try { return PersistentStore.readRaw(SHEET_HINT.KEY, storage) !== SHEET_HINT.VALUE; } catch { return true; }
}

/** Ghi nhận cử chỉ thành công; chế độ riêng tư không cản việc kéo hoặc ẩn gợi ý. */
export function dismissSheetHint(storage?: Pick<Storage, 'setItem'>): void {
  try { PersistentStore.writeRaw(SHEET_HINT.KEY, SHEET_HINT.VALUE, storage); } catch { /* Vẫn ẩn trong DOM của lần mở hiện tại. */ }
}
