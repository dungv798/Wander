import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';
import { HALF } from '../../../shared/const/math.const.ts';
import { MORPH_MS } from '../model/onboarding.const.ts';

const OLD_CARD = '.ob-layer.out .ob-fan:first-of-type, .ob-layer.out .ob-card.is-top';
const NEW_CARD = '.ob-layer.enter .ob-fan:first-of-type, .ob-layer.enter .ob-card.is-top';
const HALF_TURN_DEG = 180;
const CAPTION_DELAY_MS = 120;
const EASE = 'cubic-bezier(.22, 1, .36, 1)';

/** Góc xoay (độ) và độ phóng của một ma trận biến đổi. */
function rotation(m: DOMMatrix): number {
  return (Math.atan2(m.b, m.a) * HALF_TURN_DEG) / Math.PI;
}

/** Độ phóng của một ma trận biến đổi. */
function scaling(m: DOMMatrix): number {
  return Math.hypot(m.a, m.b);
}

/** Tâm của phần tử theo tọa độ màn hình (không đổi khi phần tử xoay quanh tâm). */
function centerOf(el: HTMLElement): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / HALF, y: r.top + r.height / HALF };
}

/** Cho thẻ mới "bay" từ đúng vị trí, góc xoay và cỡ của thẻ cũ về chỗ của nó (dùng thuộc tính translate/rotate/scale riêng nên không đụng tới transform của thẻ); thẻ cũ ẩn đi ngay vì cùng một ảnh. */
function morph(from: HTMLElement, to: HTMLElement): void {
  const a = centerOf(from);
  const b = centerOf(to);
  const mf = new DOMMatrix(getComputedStyle(from).transform);
  const mt = new DOMMatrix(getComputedStyle(to).transform);
  to.animate(
    [
      { translate: `${a.x - b.x}px ${a.y - b.y}px`, rotate: `${rotation(mf) - rotation(mt)}deg`, scale: String(scaling(mf) / scaling(mt)) },
      { translate: '0px 0px', rotate: '0deg', scale: '1' },
    ],
    { duration: MORPH_MS, easing: EASE },
  );
  to.querySelector('figcaption')?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: MORPH_MS, delay: CAPTION_DELAY_MS, fill: 'backwards' });
  from.style.visibility = 'hidden';
}

/**
 * Chuyển cảnh "cùng một thẻ": khi hai cảnh liền kề có thẻ cùng ảnh (thẻ Đà Lạt ở cảnh 1 và thẻ đầu bộ bài ở cảnh 2), thẻ mới di chuyển mượt từ vị trí thẻ cũ
 * trong lúc phần còn lại mờ dần, nên người xem thấy đó là một vật thể liên tục. Không tìm thấy thẻ hoặc khác ảnh thì bỏ qua (cảnh vẫn mờ dần bình thường).
 * `token` đổi mỗi lần chuyển cảnh để chạy lại.
 */
export function useCardMorph(stage: RefObject<HTMLElement | null>, enabled: boolean, token: string): void {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = stage.current;
    const from = root?.querySelector<HTMLElement>(OLD_CARD);
    const to = root?.querySelector<HTMLElement>(NEW_CARD);
    const same = from && to && from.querySelector('img')?.getAttribute('src') === to.querySelector('img')?.getAttribute('src');
    if (from && to && same) morph(from, to);
  }, [stage, enabled, token]);
}
