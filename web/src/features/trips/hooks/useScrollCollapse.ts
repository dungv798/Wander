import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { nextCollapsed } from '../model/scrollCollapse.ts';

/**
 * Theo dõi vùng cuộn của danh sách lịch: trả true khi nên thu gọn đầu tờ (bìa + hàng chế độ) để dành chỗ cho các thẻ (B-01).
 * Tắt (`enabled` false) thì luôn false. Quyết định có độ trễ nằm ở `nextCollapsed`.
 */
export function useScrollCollapse(scrollRef: RefObject<HTMLElement | null>, enabled: boolean): boolean {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!enabled || !el) return undefined;
    /** Cập nhật theo vị trí cuộn hiện tại. */
    const onScroll = (): void => setCollapsed((current) => nextCollapsed(current, el.scrollTop, el.scrollHeight - el.clientHeight));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      setCollapsed(false);
    };
  }, [enabled, scrollRef]);
  return enabled && collapsed;
}
