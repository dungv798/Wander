import { useEffect } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';

/** Phím ← bỏ qua, → chọn: tương đương hai nút ✕/✓ (cho người dùng bàn phím). */
export function useArrowKeys(onAct: (kind: SwipeKind) => void): void {
  useEffect(() => {
    /** Chuyển phím mũi tên thành hành động quẹt. */
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight') onAct('pick');
      else if (e.key === 'ArrowLeft') onAct('skip');
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [onAct]);
}
