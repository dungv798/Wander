import { COLLAPSE } from './scrollCollapse.const.ts';

/**
 * Trạng thái thu gọn kế tiếp của đầu tờ chuyến: thu gọn khi cuộn quá `AT_PX` và còn đủ chỗ cuộn, mở lại khi về gần đầu.
 * `scrollTop`: vị trí cuộn hiện tại; `scrollable`: scrollHeight − clientHeight của vùng cuộn (px).
 */
export function nextCollapsed(current: boolean, scrollTop: number, scrollable: number): boolean {
  if (current) return scrollTop > COLLAPSE.EXPAND_AT_PX;
  return scrollTop > COLLAPSE.AT_PX && scrollable >= COLLAPSE.MIN_SCROLLABLE_PX;
}
