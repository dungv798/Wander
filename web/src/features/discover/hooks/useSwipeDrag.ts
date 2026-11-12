import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { SWIPE } from '../../../shared/const/app.const.ts';
import { usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';
import { fling, paintDrag, resetDrag, shouldCommit } from '../model/swipeGesture.ts';
import type { SwipeDir } from '../model/swipeGesture.ts';

/** Elements inside the card do NOT start a drag gesture (the photo-source button...). */
const NO_DRAG_SELECTOR = '.more, .credit-btn, .credit-pill';

interface SwipeHandlers {
  /** A swipe past the threshold (or a button press): the card flies away and then a decision is made. */
  readonly onDecide: (dir: SwipeDir) => void;
  /** Tapping the left/right half of a multi-photo card: the previous/next photo. */
  readonly onShiftPhoto: (delta: number) => void;
  /** Tapping the name-info block (or a single-photo card): opens the detail. */
  readonly onTap: () => void;
  /** A card with several photos (turns on the photo-switch tap zones at the two edges). */
  readonly multiPhoto: boolean;
}

/**
 * The drag gesture for the swipe card, using pointer events (mouse, touch, pen) and editing the style directly so it does not re-render on every move.
 * Returns the handler attached to the card at the top of the deck.
 */
export function useSwipeDrag({ onDecide, onShiftPhoto, onTap, multiPhoto }: SwipeHandlers) {
  const reduced = usePrefersReducedMotion();
  const drag = useRef({ down: false, moved: false, sx: 0, sy: 0, dx: 0, dy: 0, t0: 0 });

  const onPointerDown = (e: PointerEvent<HTMLElement>): void => {
    if (!e.isPrimary || e.button !== 0 || (e.target as HTMLElement).closest(NO_DRAG_SELECTOR)) return;
    const d = drag.current;
    Object.assign(d, { down: true, moved: false, dx: 0, dy: 0, sx: e.clientX, sy: e.clientY, t0: performance.now() });
    e.currentTarget.style.transition = 'none';
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer could not be captured: it can still be dragged inside the card */
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>): void => {
    const d = drag.current;
    if (!d.down) return;
    d.dx = e.clientX - d.sx;
    d.dy = e.clientY - d.sy;
    if (Math.abs(d.dx) + Math.abs(d.dy) > SWIPE.TAP_MOVE_PX) d.moved = true;
    paintDrag(e.currentTarget, d.dx, d.dy);
  };

  const finish = (e: PointerEvent<HTMLElement>): void => {
    const d = drag.current;
    if (!d.down) return;
    d.down = false;
    const card = e.currentTarget;
    const velocity = d.dx / Math.max(1, performance.now() - d.t0);
    if (shouldCommit(d.dx, velocity)) {
      const dir: SwipeDir = d.dx > 0 ? 'r' : 'l';
      fling(card, dir, reduced, () => onDecide(dir));
      return;
    }
    resetDrag(card);
    if (d.moved || e.type !== 'pointerup') return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    // the pointer was 'captured' by the card so e.target is always the card: judge by the tap position against the info block's frame
    const info = card.querySelector(SWIPE.DETAIL_TAP_SELECTOR)?.getBoundingClientRect();
    const onInfo = Boolean(info && e.clientY >= info.top && e.clientY <= info.bottom);
    // a multi-photo card: the left/right half switches the photo; tapping the name-info block (or a single-photo card) opens the detail
    if (multiPhoto && !onInfo) onShiftPhoto(x < SWIPE.PHOTO_SPLIT ? -1 : 1);
    else onTap();
  };

  /** The system cancels the pointer (a notification bar pulled down...): puts the card back, does NOT commit a decision. */
  const cancel = (e: PointerEvent<HTMLElement>): void => {
    if (!drag.current.down) return;
    drag.current.down = false;
    resetDrag(e.currentTarget);
  };

  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: cancel };
}
