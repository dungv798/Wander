import { useEffect } from 'react';
import { CHROME_ATTR, CHROME_HIDDEN, SCROLL_CHROME } from './scrollChrome.const.ts';

/** Quyết định thanh trên/dưới nên ẩn hay không từ vị trí cuộn, điểm đảo chiều gần nhất và trạng thái hiện tại; thuần túy để test được. */
export function nextChromeHidden(input: { readonly y: number; readonly max: number; readonly anchor: number; readonly hidden: boolean }): { readonly hidden: boolean; readonly anchor: number } {
  const { y, max, anchor, hidden } = input;
  // Kéo giãn quá đầu/đáy (rubber-band) không được tính là cử chỉ.
  if (y < 0 || y > max) return { hidden, anchor };
  if (y <= SCROLL_CHROME.ALWAYS_SHOW_ABOVE_PX || y >= max - SCROLL_CHROME.ALWAYS_SHOW_NEAR_END_PX) return { hidden: false, anchor: y };
  if (!hidden) {
    // Đang hiện: đi lên thì kéo điểm đảo chiều theo; chỉ ẩn khi đã đi xuống đủ xa từ điểm đó.
    if (y < anchor) return { hidden: false, anchor: y };
    return y - anchor >= SCROLL_CHROME.HIDE_AFTER_DOWN_PX ? { hidden: true, anchor: y } : { hidden: false, anchor };
  }
  // Đang ẩn: đi xuống thì kéo điểm đảo chiều theo; hiện lại khi đã đi lên đủ xa.
  if (y > anchor) return { hidden: true, anchor: y };
  return anchor - y >= SCROLL_CHROME.SHOW_AFTER_UP_PX ? { hidden: false, anchor: y } : { hidden: true, anchor };
}

/**
 * Full màn trên điện thoại: thanh trên/dưới trượt ra khi cuộn xuống, hiện lại ngay khi cuộn lên hoặc chạm cuối trang.
 * Chỉ đặt thuộc tính `data-chrome` trên <html>; việc di chuyển là `transform` trong CSS (không đo lại bố cục).
 * Tắt (`enabled = false`) khi bản đồ đang mở hoặc ở màn rộng: thanh luôn hiện.
 */
export function useScrollChrome(enabled: boolean, routeKey: string): void {
  useEffect(() => {
    const root = document.documentElement;
    root.removeAttribute(CHROME_ATTR);
    if (!enabled) return undefined;
    let hidden = false;
    let anchor = window.scrollY;
    let frame = 0;
    /** Gộp nhiều sự kiện cuộn trong một khung hình. */
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
