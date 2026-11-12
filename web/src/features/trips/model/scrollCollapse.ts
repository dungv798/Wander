import { COLLAPSE } from './scrollCollapse.const.ts';

/**
 * The next collapsed state of the trip sheet head: collapse when scrolled past `AT_PX` and there is enough room to scroll, re-open when back near the top.
 * `scrollTop`: the current scroll position; `scrollable`: scrollHeight - clientHeight of the scroll area (px).
 */
export function nextCollapsed(current: boolean, scrollTop: number, scrollable: number): boolean {
  if (current) return scrollTop > COLLAPSE.EXPAND_AT_PX;
  return scrollTop > COLLAPSE.AT_PX && scrollable >= COLLAPSE.MIN_SCROLLABLE_PX;
}
