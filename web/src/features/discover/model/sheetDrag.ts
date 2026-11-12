import { SHEET_DRAG } from './shellMap.const.ts';

/** The state of the content sheet on a phone: open (covers most of the map) or collapsed (only the title strip remains). */
export type SheetDragMode = 'open' | 'peek';

/** The displayed offset while dragging: only in the direction that leads to the other state (open -> drag down; collapsed -> drag up), no more than `travel` px. */
export function clampDragOffset(mode: SheetDragMode, dy: number, travel: number): number {
  return mode === 'open' ? Math.min(travel, Math.max(0, dy)) : Math.max(-travel, Math.min(0, dy));
}

/** A touch whose movement is smaller than the threshold is a tap, not a drag. */
export function isTap(dx: number, dy: number): boolean {
  return Math.hypot(dx, dy) <= SHEET_DRAG.TAP_SLOP_PX;
}

/**
 * The state after release: switches to the other state if dragged far enough (`COMMIT_FRACTION` of `travel`) or flicked fast enough; otherwise unchanged.
 * `dy` is the vertical offset (positive = down), `elapsedMs` is the drag time, `travel` is the distance between the two states (px).
 */
export function decideSheetMode(mode: SheetDragMode, dy: number, elapsedMs: number, travel: number): SheetDragMode {
  const towardOther = mode === 'open' ? dy : -dy;
  if (towardOther <= 0) return mode;
  const velocity = towardOther / Math.max(1, elapsedMs);
  const committed = towardOther >= travel * SHEET_DRAG.COMMIT_FRACTION || velocity >= SHEET_DRAG.FLING_PX_PER_MS;
  if (!committed) return mode;
  return mode === 'open' ? 'peek' : 'open';
}
