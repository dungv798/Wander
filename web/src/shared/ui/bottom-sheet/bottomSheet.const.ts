/** The steps of the draggable sheet. */
export type Snap = 'peek' | 'half' | 'full';

/** The step order from low to high. */
export const SNAP_ORDER: readonly Snap[] = ['peek', 'half', 'full'];
/** A light hint, it only remembers that the gesture was used; it stores no trip data. */
export const SHEET_HINT = { KEY: 'wander.web.sheet-dragged.v1', TEXT: 'Kéo lên xem lịch', VALUE: '1', CLASS: 'sheet-drag-hint' } as const;
export const SHEET_ROUTE_PARTS = 3;

/** Constants of the draggable sheet (px unless noted). Moved from docs/ux/prototype/app/sheet.js. */
export const SHEET = {
  /** The visible height at the collapsed step (enough to see the handle + title + tabs). */
  PEEK_VISIBLE: 168,
  HALF_RATIO: 0.75,
  /** The full step's distance from the top edge of the frame (leaves room for the floating buttons on the map). */
  FULL_TOP: 72,
  /** The velocity (px/ms) enough to jump to the next step in the swipe direction. */
  VELOCITY_SNAP: 0.45,
  TAP_MAX_MOVE: 6,
  OVERDRAG_DOWN: 40,
  OVERDRAG_UP: 12,
} as const;
