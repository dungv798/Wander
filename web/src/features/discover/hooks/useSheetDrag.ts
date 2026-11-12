import { useRef } from 'react';
import type { PointerEvent, MouseEvent } from 'react';
import { SHEET_DRAG } from '../model/shellMap.const.ts';
import { clampDragOffset, decideSheetMode, isTap } from '../model/sheetDrag.ts';
import type { SheetDragMode } from '../model/sheetDrag.ts';

/** The CSS variable name that holds the sheet's offset while dragging (px); \`shell.css\` uses it to move the sheet and the handle with the finger. */
const DRAG_VAR = '--sheet-drag-y';
/** The attribute on \`.app\` that is on while dragging (CSS turns off the animation so the sheet follows the finger closely). */
const DRAGGING_ATTR = 'data-dragging';

/** The state of a drag that is in progress. */
interface DragState {
  readonly startX: number;
  readonly startY: number;
  readonly startedAt: number;
  readonly app: HTMLElement;
  readonly travel: number;
  moved: boolean;
}

/** The event handlers for the sheet's handle. */
export interface SheetDragHandlers {
  readonly onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  /** Blocks the 'click' the browser generates right after a drag, so a drag is not counted as a tap that toggles the state. */
  readonly onClickCapture: (event: MouseEvent<HTMLElement>) => void;
}

/** Measures the distance between the two states of the sheet (px): from the open position to the collapsed position (\`--shell-peek-height\` counted from the bottom of the frame). */
function measureTravel(app: HTMLElement, mode: SheetDragMode, openTop: { current: number | null }): number {
  const height = window.innerHeight;
  const screen = app.querySelector<HTMLElement>('#screen');
  if (mode === 'open' && screen) openTop.current = screen.getBoundingClientRect().top;
  const peekHeight = parseFloat(getComputedStyle(app).getPropertyValue('--shell-peek-height')) || 0;
  return Math.max(1, height - peekHeight - (openTop.current ?? height * SHEET_DRAG.FALLBACK_OPEN_TOP_FRACTION));
}

/** Removes the offset and the drag flag from the app frame (the sheet slides to/from the final position thanks to the CSS animation). */
function clearDragVisuals(app: HTMLElement): void {
  app.style.removeProperty(DRAG_VAR);
  app.removeAttribute(DRAGGING_ATTR);
}

/**
 * Drags the content sheet on a phone with the handle: drag down to collapse (see a wider map), drag up to open it again; the sheet follows the finger and
 * switches state on release if far enough or fast enough. A tap (no drag) is still handled by the button's \`onClick\`.
 */
export function useSheetDrag(mode: SheetDragMode, setMode: (mode: SheetDragMode) => void): SheetDragHandlers {
  const drag = useRef<DragState | null>(null);
  const openTop = useRef<number | null>(null);
  const swallowClick = useRef(false);
  return {
    /** Starts a drag: records the start position, measures the distance between the two states and keeps the pointer on the handle. */
    onPointerDown(event) {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const app = event.currentTarget.closest<HTMLElement>('.app');
      if (!app) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { startX: event.clientX, startY: event.clientY, startedAt: event.timeStamp, app, travel: measureTravel(app, mode, openTop), moved: false };
    },
    /** While dragging: past the tap threshold it turns on the drag flag and moves the sheet with the finger (clamped to the valid distance). */
    onPointerMove(event) {
      const state = drag.current;
      if (!state) return;
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;
      if (!state.moved && isTap(dx, dy)) return;
      state.moved = true;
      state.app.setAttribute(DRAGGING_ATTR, '');
      state.app.style.setProperty(DRAG_VAR, `${clampDragOffset(mode, dy, state.travel)}px`);
    },
    /** On release: removes the drag effect; if it was dragged it switches state when far/fast enough and swallows the accompanying click. */
    onPointerUp(event) {
      const state = drag.current;
      drag.current = null;
      if (!state) return;
      clearDragVisuals(state.app);
      if (!state.moved) return;
      swallowClick.current = true;
      window.setTimeout(() => { swallowClick.current = false; }, 0); // if the browser generates no click the flag is not kept for the next tap
      const next = decideSheetMode(mode, event.clientY - state.startY, event.timeStamp - state.startedAt, state.travel);
      if (next !== mode) setMode(next);
    },
    /** The system cancels the gesture (for example scrolling): the drag is dropped, the sheet slides back to where it was. */
    onPointerCancel() {
      const state = drag.current;
      drag.current = null;
      if (state) clearDragVisuals(state.app);
    },
    /** Swallows the click generated right after a drag so a drag is not counted as a tap that toggles the state. */
    onClickCapture(event) {
      if (!swallowClick.current) return;
      swallowClick.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
