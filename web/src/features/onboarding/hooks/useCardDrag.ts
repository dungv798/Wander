import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';
import { SWIPE } from '../model/onboarding.const.ts';

interface CardDragOptions {
  /** The viewer starts dragging: stops the demo, locks the deck into drag mode. */
  readonly onStart: () => void;
  /** Dragging past the threshold (+/-) lights up the matching button; going back to the middle turns it off. */
  readonly onLean: (kind: SwipeKind | null) => void;
  /** Released past the swipe threshold. */
  readonly onCommit: (kind: SwipeKind) => void;
  /** Released before reaching the threshold: the card returns to the middle. */
  readonly onCancel: () => void;
}

/** The pointer handlers attached to the top card. */
export interface CardDragHandlers {
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

/** Drags the card with a finger/mouse: the card tilts in the drag direction (CSS variables `--dx`, `--dy`), the CHOOSE/SKIP labels fade in by CSS. */
export function useCardDrag({ onStart, onLean, onCommit, onCancel }: CardDragOptions): CardDragHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);
  const lean = useRef<SwipeKind | null>(null);
  /** Updates the tilt direction and reports when it changes. */
  const setLean = (next: SwipeKind | null): void => {
    if (lean.current === next) return;
    lean.current = next;
    onLean(next);
  };
  /** Returns the card to the resting state (clears the offset). */
  const rest = (el: HTMLElement): void => {
    el.style.removeProperty('--dx');
    el.style.removeProperty('--dy');
  };
  return {
    onPointerDown: (e) => {
      onStart();
      start.current = { x: e.clientX, y: e.clientY };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e) => {
      const s = start.current;
      if (!s) return;
      const dx = e.clientX - s.x;
      e.currentTarget.style.setProperty('--dx', String(dx));
      e.currentTarget.style.setProperty('--dy', String((e.clientY - s.y) * SWIPE.USER_DY_RATIO));
      setLean(dx > SWIPE.LIT_USER_PX ? 'pick' : dx < -SWIPE.LIT_USER_PX ? 'skip' : null);
    },
    onPointerUp: (e) => {
      const s = start.current;
      start.current = null;
      setLean(null);
      if (!s) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > SWIPE.USER_COMMIT_PX) onCommit(dx > 0 ? 'pick' : 'skip');
      else {
        rest(e.currentTarget);
        onCancel();
      }
    },
    onPointerCancel: (e) => {
      start.current = null;
      setLean(null);
      rest(e.currentTarget);
      onCancel();
    },
  };
}
