import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';

/**
 * Thư viện ảnh cuộn ngang có điểm dừng: theo dõi ảnh đang xem, chuyển ảnh bằng nút/phím, và kéo bằng chuột trên máy tính
 * (cảm ứng đã cuộn tự nhiên). Giảm chuyển động thì nhảy thẳng thay vì cuộn mượt.
 */
export function useGallery(count: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const mouse = useRef({ down: false, startX: 0, startLeft: 0 });

  /** Chỉ số ảnh hiện tại suy từ vị trí cuộn. */
  const read = useCallback((): number => {
    const g = ref.current;
    return g ? Math.round(g.scrollLeft / Math.max(1, g.clientWidth)) : 0;
  }, []);

  useEffect(() => {
    const g = ref.current;
    if (!g) return undefined;
    const onScroll = (): void => setIndex(read());
    g.addEventListener('scroll', onScroll, { passive: true });
    return () => g.removeEventListener('scroll', onScroll);
  }, [read]);

  /** Cuộn tới ảnh `delta` bước từ ảnh hiện tại (kẹp trong khoảng). */
  const go = useCallback(
    (delta: number): void => {
      const g = ref.current;
      if (!g) return;
      const next = Math.max(0, Math.min(count - 1, read() + delta));
      g.scrollTo({ left: next * g.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    },
    [count, read, reduced],
  );

  const onPointerDown = (e: PointerEvent<HTMLDivElement>): void => {
    const g = ref.current;
    if (e.pointerType !== 'mouse' || !g) return;
    mouse.current = { down: true, startX: e.clientX, startLeft: g.scrollLeft };
    g.style.scrollSnapType = 'none';
    g.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>): void => {
    const g = ref.current;
    if (mouse.current.down && g) g.scrollLeft = mouse.current.startLeft - (e.clientX - mouse.current.startX);
  };
  const end = (): void => {
    const g = ref.current;
    if (!mouse.current.down || !g) return;
    mouse.current.down = false;
    g.style.scrollSnapType = '';
    g.scrollTo({ left: read() * g.clientWidth, behavior: 'auto' });
  };

  return { ref, index, go, pointer: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}
