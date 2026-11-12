import { useLayoutEffect, useRef } from 'react';
import { lockDocumentScroll } from '../shared/lib/lockDocumentScroll.ts';
import { restoreDocumentPosition } from './restoreDocumentPosition.ts';

/** One natural scroll region for the phone list; opening the map keeps the position being read. */
export function useDocumentScroll(enabled: boolean, mapOpen: boolean, routeKey: string): void {
  const positions = useRef(new Map<string, number>());
  const poppedHash = useRef<string | null>(null);
  useLayoutEffect(() => {
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    /** Back/Forward restore the position; picking a new page always starts from the top. */
    const popped = (): void => { poppedHash.current = location.hash; };
    window.addEventListener('popstate', popped);
    return () => { history.scrollRestoration = previous; window.removeEventListener('popstate', popped); };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.toggleAttribute('data-document-scroll', enabled);
    const top = enabled && poppedHash.current === location.hash ? positions.current.get(routeKey) ?? 0 : 0;
    poppedHash.current = null;
    const stopRestore = restoreDocumentPosition(top);
    /** Does not record a temporary position 0 while the map/dialog is locking the body. */
    const remember = (): void => {
      if (enabled && !root.hasAttribute('data-scroll-locked')) positions.current.set(routeKey, window.scrollY);
    };
    window.addEventListener('scroll', remember, { passive: true });
    return () => {
      stopRestore();
      window.removeEventListener('scroll', remember);
      root.removeAttribute('data-document-scroll');
    };
  }, [enabled, routeKey]);

  useLayoutEffect(() => {
    if (!enabled || !mapOpen) return undefined;
    positions.current.set(routeKey, window.scrollY);
    document.documentElement.setAttribute('data-map-view', '');
    const unlock = lockDocumentScroll();
    return () => {
      document.documentElement.removeAttribute('data-map-view');
      unlock();
    };
  }, [enabled, mapOpen, routeKey]);
}
