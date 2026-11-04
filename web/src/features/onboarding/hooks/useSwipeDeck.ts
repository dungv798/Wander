import { useCallback, useEffect, useReducer, useState } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';
import { deckReducer, EMPTY_DECK } from '../model/swipeDeck.ts';
import type { DeckState } from '../model/swipeDeck.ts';
import { SWIPE } from '../model/onboarding.const.ts';

/** Bộ bài quẹt: trạng thái, thẻ đang bị kéo, cờ "đang bay" chặn quẹt chồng, và đặt lại không có chuyển động ngược. */
export interface SwipeDeck {
  readonly state: DeckState;
  readonly dragging: number | null;
  readonly snapping: boolean;
  readonly setDragging: (index: number | null) => void;
  /** Quẹt thẻ trên cùng; trả `false` (không làm gì) nếu hết thẻ hoặc thẻ trước còn đang bay. */
  readonly commit: (kind: SwipeKind) => boolean;
  readonly reset: () => void;
}

/** Quản lý bộ bài `total` thẻ. Thẻ bay đi mất `SETTLE_MS` trước khi nhận lượt quẹt kế tiếp. */
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
    /** Quẹt thẻ trên cùng nếu được phép. */
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
