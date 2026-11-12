import { useCallback, useEffect, useReducer, useState } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';
import { deckReducer, EMPTY_DECK } from '../model/swipeDeck.ts';
import type { DeckState } from '../model/swipeDeck.ts';
import { SWIPE } from '../model/onboarding.const.ts';

/** The swipe deck: the state, the card being dragged, the 'flying' flag that blocks overlapping swipes, and a reset without a reverse motion. */
export interface SwipeDeck {
  readonly state: DeckState;
  readonly dragging: number | null;
  readonly snapping: boolean;
  readonly setDragging: (index: number | null) => void;
  /** Swipes the top card; returns `false` (does nothing) if there are no cards or the previous card is still flying. */
  readonly commit: (kind: SwipeKind) => boolean;
  readonly reset: () => void;
}

/** Manages a deck of `total` cards. A card that flies away takes `SETTLE_MS` before the next swipe is accepted. */
export function useSwipeDeck(total: number): SwipeDeck {
  const [state, dispatch] = useReducer(deckReducer, EMPTY_DECK);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const [snapping, setSnapping] = useState(false);
  useEffect(() => {
    if (!busy) return undefined;
    const timer = setTimeout(() => setBusy(false), SWIPE.SETTLE_MS);
    return () => clearTimeout(timer);
  }, [busy]);
  useEffect(() => {
    if (!snapping) return undefined;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setSnapping(false)));
    return () => cancelAnimationFrame(frame);
  }, [snapping]);
  const commit = useCallback(
    /** Swipes the top card if allowed. */
    (kind: SwipeKind): boolean => {
      if (busy || state.cur >= total) return false;
      setBusy(true);
      setDragging(null);
      dispatch({ type: 'commit', kind, total });
      return true;
    },
    [busy, state.cur, total],
  );
  const reset = useCallback(() => {
    setBusy(false);
    setDragging(null);
    setSnapping(true);
    dispatch({ type: 'reset' });
  }, []);
  return { state, dragging, snapping, setDragging, commit, reset };
}
