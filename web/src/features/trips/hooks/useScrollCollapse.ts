import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { nextCollapsed } from '../model/scrollCollapse.ts';

/**
 * Watches the scroll area of the schedule list: returns true when the sheet head (cover + mode row) should collapse to leave room for the cards (B-01).
 * When off (`enabled` false) it is always false. The decision with hysteresis is in `nextCollapsed`.
 */
export function useScrollCollapse(scrollRef: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return undefined;
    /** Updates by the current scroll position. */
    const onScroll = (): void => setCollapsed((current) => nextCollapsed(current, el.scrollTop, el.scrollHeight - el.clientHeight));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      setCollapsed(false);
    };
  }, [enabled, scrollRef]);
  return enabled && collapsed;
}
