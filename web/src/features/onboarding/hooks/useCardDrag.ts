import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { SwipeKind } from '../model/swipeDeck.ts';
import { SWIPE } from '../model/onboarding.const.ts';

interface CardDragOptions {
  /** Người xem bắt đầu kéo: dừng demo, khóa bộ bài vào chế độ kéo. */
  readonly onStart: () => void;
  /** Kéo qua ngưỡng (±) thì nhấn sáng nút tương ứng; về lại giữa thì tắt. */
  readonly onLean: (kind: SwipeKind | null) => void;
  /** Thả tay quá ngưỡng quẹt. */
  readonly onCommit: (kind: SwipeKind) => void;
  /** Thả tay chưa đủ ngưỡng: thẻ trở về giữa. */
  readonly onCancel: () => void;
}

/** Bộ xử lý con trỏ gắn vào thẻ trên cùng. */
export interface CardDragHandlers {
  readonly onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  readonly onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
}

/** Kéo thẻ bằng ngón tay/chuột: thẻ nghiêng theo hướng kéo (biến CSS `--dx`, `--dy`), nhãn CHỌN/BỎ QUA hiện dần bằng CSS. */
export function useCardDrag({ onStart, onLean, onCommit, onCancel }: CardDragOptions): CardDragHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);
  const lean = useRef<SwipeKind | null>(null);
  /** Cập nhật hướng nghiêng và báo khi đổi. */
  const setLean = (next: SwipeKind | null): void => {
    if (lean.current === next) return;
    lean.current = next;
    onLean(next);
  };
  /** Trả thẻ về trạng thái nghỉ (xóa độ lệch). */
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
