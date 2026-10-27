import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery.ts';

const REVEAL_CLASS = 'in';
const ROOT_MARGIN = '0px 0px -8% 0px';
const THRESHOLD = 0.08;

/**
 * Hiện dần các khối `.rv` bên trong vùng gắn ref khi cuộn tới (thêm lớp `in` một lần).
 * Giảm chuyển động hoặc không có IntersectionObserver thì hiện ngay. `rootSelector` là vùng cuộn (mặc định `#screen`).
 */
export function useReveal<E extends HTMLElement>(rootSelector = '#screen'): React.RefObject<E | null> {
  const ref = useRef<E | null>(null);
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    const host = ref.current;
    if (!host) return undefined;
    const items = host.querySelectorAll<HTMLElement>('.rv');
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add(REVEAL_CLASS));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add(REVEAL_CLASS);
          observer.unobserve(e.target);
        });
      },
      { root: document.querySelector(rootSelector), rootMargin: ROOT_MARGIN, threshold: THRESHOLD },
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });
  return ref;
}
