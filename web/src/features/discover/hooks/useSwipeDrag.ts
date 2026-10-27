import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { SWIPE } from '../../../shared/const/app.const.ts';
import { usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';
import { fling, paintDrag, resetDrag, shouldCommit } from '../model/swipeGesture.ts';
import type { SwipeDir } from '../model/swipeGesture.ts';

/** Phần tử bên trong thẻ KHÔNG bắt đầu cử chỉ kéo (nút nguồn ảnh…). */
const NO_DRAG_SELECTOR = '.more, .credit-btn, .credit-pill';

interface SwipeHandlers {
  /** Quẹt đủ ngưỡng (hoặc bấm nút): bay thẻ rồi quyết định. */
  readonly onDecide: (dir: SwipeDir) => void;
  /** Chạm cạnh trái/phải của thẻ nhiều ảnh: đổi ảnh. */
  readonly onShiftPhoto: (delta: number) => void;
  /** Chạm giữa thẻ: mở chi tiết. */
  readonly onTap: () => void;
  /** Thẻ có nhiều ảnh (bật vùng chạm đổi ảnh ở hai cạnh). */
  readonly multiPhoto: boolean;
}

/**
 * Cử chỉ kéo cho thẻ quẹt, dùng pointer events (chuột, cảm ứng, bút) và sửa style trực tiếp để không render lại mỗi lần di chuyển.
 * Trả bộ xử lý gắn vào thẻ ở đầu bộ bài.
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
      /* không bắt được con trỏ: vẫn kéo được trong thẻ */
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
    if (multiPhoto && x < SWIPE.EDGE_LEFT) onShiftPhoto(-1);
    else if (multiPhoto && x > SWIPE.EDGE_RIGHT) onShiftPhoto(1);
    else onTap();
  };

  /** Hệ thống hủy con trỏ (thanh thông báo kéo xuống…): đưa thẻ về chỗ cũ, KHÔNG chốt quyết định. */
  const cancel = (e: PointerEvent<HTMLElement>): void => {
    if (!drag.current.down) return;
    drag.current.down = false;
    resetDrag(e.currentTarget);
  };

  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: cancel };
}
