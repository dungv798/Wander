import { PersistentStore } from '../../state/PersistentStore.ts';
import { SHEET_HINT, SHEET_ROUTE_PARTS } from './bottomSheet.const.ts';
import type { Snap } from './bottomSheet.const.ts';

const snaps = new Map<string, Snap>();

/** Keeps the step per screen/trip in the session, dropping the last tab part of the URL so changing the day does not collapse the sheet. */
export function sheetMemoryKey(hash: string): string {
  return hash.split('/').slice(0, SHEET_ROUTE_PARTS).join('/');
}

/** Reads the step used in the session; a new screen still uses the caller's default step. */
export function rememberedSnap(key: string, fallback: Snap): Snap { return snaps.get(key) ?? fallback; }

/** Writes the step after each change, without needing to write trip information to the device. */
export function rememberSnap(key: string, snap: Snap): void { snaps.set(key, snap); }

/** Blocked storage still shows the drag invitation and does not break the schedule screen. */
export function shouldShowSheetHint(storage?: Pick<Storage, 'getItem'>): boolean {
  try { return PersistentStore.readRaw(SHEET_HINT.KEY, storage) !== SHEET_HINT.VALUE; } catch { return true; }
}

/** Records a successful gesture; private mode does not block dragging or hiding the hint. */
export function dismissSheetHint(storage?: Pick<Storage, 'setItem'>): void {
  try { PersistentStore.writeRaw(SHEET_HINT.KEY, SHEET_HINT.VALUE, storage); } catch { /* Still hidden in the DOM of the current open. */ }
}
