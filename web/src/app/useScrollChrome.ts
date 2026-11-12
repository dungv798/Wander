import { useEffect } from 'react';
import { CHROME_ATTR, CHROME_HIDDEN, SCROLL_CHROME } from './scrollChrome.const.ts';

/** Decides whether the top/bottom bars should hide from the scroll position, the nearest reversal point and the current state; pure so it can be tested. */
export function nextChromeHidden(input: { readonly y: number; readonly max: number; readonly anchor: number; readonly hidden: boolean }): { readonly hidden: boolean; readonly anchor: number } {
  const { y, max, anchor, hidden } = input;
  // Overscroll past the top/bottom (rubber-band) does not count as a gesture.
  if (y < 0 || y > max) return { hidden, anchor };
  if (y <= SCROLL_CHROME.ALWAYS_SHOW_ABOVE_PX || y >= max - SCROLL_CHROME.ALWAYS_SHOW_NEAR_END_PX) return { hidden: false, anchor: y };
  if (!hidden) {
    // While shown: going up drags the reversal point along; hide only when it has gone down far enough from that point.
    if (y < anchor) return { hidden: false, anchor: y };
    return y - anchor >= SCROLL_CHROME.HIDE_AFTER_DOWN_PX ? { hidden: true, anchor: y } : { hidden: false, anchor };
  }
  // While hidden: going down drags the reversal point along; show again when it has gone up far enough.
  if (y > anchor) return { hidden: true, anchor: y };
  return anchor - y >= SCROLL_CHROME.SHOW_AFTER_UP_PX ? { hidden: false, anchor: y } : { hidden: true, anchor };
}

/**
 * Full screen on a phone: the top/bottom bars slide out when scrolling down, and come back immediately on scrolling up or reaching the end of the page.
 * Only sets the `data-chrome` attribute on <html>; the movement is a CSS `transform` (the layout is not measured again).
 * Off (`enabled = false`) when the map is open or on a wide screen: the bars are always shown.
 */
export function useScrollChrome(enabled: boolean, routeKey: string): void {
  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute(CHROME_ATTR);
    if (!enabled) return undefined;
    let hidden = false;
    let anchor = window.scrollY;
    let frame = 0;
    /** Batches several scroll events in one frame. */
    const update = (): void => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const next = nextChromeHidden({ y: window.scrollY, max, anchor, hidden });
      anchor = next.anchor;
      if (next.hidden === hidden) return;
      hidden = next.hidden;
      if (hidden) root.setAttribute(CHROME_ATTR, CHROME_HIDDEN); else root.removeAttribute(CHROME_ATTR);
    };
    const onScroll = (): void => { if (frame === 0) frame = window.requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      root.removeAttribute(CHROME_ATTR);
    };
  }, [enabled, routeKey]);
}
