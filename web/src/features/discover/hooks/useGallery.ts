import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { usePrefersReducedMotion } from '../../../shared/hooks/useMediaQuery.ts';
import { galleryIndex, galleryIndexAt } from '../model/galleryPosition.ts';

/**
 * A horizontally scrolling photo gallery with snap points: tracks the photo being viewed, switches photos by button/key, and drags with the mouse on a computer
 * (touch already scrolls naturally). With reduced motion it jumps directly instead of scrolling smoothly.
 */
export function useGallery(count: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const reduced = usePrefersReducedMotion();
  const mouse = useRef({ down: false, startX: 0, startLeft: 0 });
  const currentIndex = useRef(0);

  /** One step always equals the gallery frame, independent of whether it was opened from the map or the deck. */
  const step = useCallback((): number => {
    const g = ref.current;
    return Math.max(1, g?.clientWidth ?? 1);
  }, []);

  /** The current photo index derived from the scroll position. */
  const read = useCallback((): number => {
    const g = ref.current;
    return g ? galleryIndexAt(g.scrollLeft, step(), count) : 0;
  }, [count, step]);

  useEffect(() => {
    const g = ref.current;
    if (!g) return undefined;
    const onScroll = (): void => {
      currentIndex.current = read();
      setIndex(currentIndex.current);
    };
    const resize = new ResizeObserver(() => {
      g.scrollTo({ left: galleryIndex(currentIndex.current, count) * step(), behavior: 'instant' });
    });
    g.addEventListener('scroll', onScroll, { passive: true });
    resize.observe(g);
    return () => {
      g.removeEventListener('scroll', onScroll);
      resize.disconnect();
    };
  }, [count, read, step]);

  /** Scrolls to the photo `delta` steps from the current photo (clamped to the range). */
  const go = useCallback(
    (delta: number): void => {
      const g = ref.current;
      if (!g) return;
      const next = galleryIndex(read() + delta, count);
      g.scrollTo({ left: next * step(), behavior: reduced ? 'auto' : 'smooth' });
    },
    [count, read, reduced, step],
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
    g.scrollTo({ left: read() * step(), behavior: 'auto' });
  };

  return { ref, index, go, pointer: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end } };
}
