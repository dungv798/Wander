import { useEffect } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';

/** The left key skips, the right key chooses: equivalent to the two buttons X/check (for keyboard users). */
export function useArrowKeys(onAct: (kind: SwipeKind) => void): void {
  useEffect(() => {
    /** Turns the arrow keys into a swipe action. */
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') onAct('pick');
      else if (e.key === 'ArrowLeft') onAct('skip');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onAct]);
}
