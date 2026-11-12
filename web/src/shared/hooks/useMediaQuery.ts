import { useCallback, useSyncExternalStore } from 'react';
import { MEDIA } from '../const/app.const.ts';

/** Watches a media query (for example a wide screen); re-renders when the result changes. On the server/with no `matchMedia` it returns `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    /** Subscribes to changes of the query. */
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    /** The current result of the query. */
    () => window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Wide screen (>= 768 px): a side bar replaces the tab bar, a different hero. */
export function useIsWide(): boolean {
  return useMediaQuery(MEDIA.WIDE);
}

/** The user asked for reduced motion: turns off unnecessary animation (a11y). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA.REDUCED_MOTION);
}
