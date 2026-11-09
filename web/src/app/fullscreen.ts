import { FULLSCREEN } from '../shared/const/fullscreen.const.ts';
import { readUrlFlag } from '../shared/lib/urlFlag.ts';

/** Trang đã cuộn đủ xa để coi Safari đã thu thanh công cụ (từ đó bản đồ và tờ nhận lại cử chỉ dọc). */
export function isToolbarCollapsed(scrollY: number): boolean {
  return scrollY >= FULLSCREEN.COLLAPSED_SCROLL_PX;
}

/**
 * Theo dõi cuộn của TRANG: đặt `data-fs-collapsed` khi đã thu thanh (CSS trả cử chỉ cho bản đồ/tờ) và `data-fs-scrolling` trong lúc đang cuộn
 * (CSS tạm bỏ kính mờ trên bản đồ để khỏi giật lúc thanh đang co).
 */
function trackScroll(root: HTMLElement): void {
  let idleTimer = 0;
  const sync = (): void => { root.toggleAttribute('data-fs-collapsed', isToolbarCollapsed(window.scrollY)); };
  window.addEventListener('scroll', () => {
    sync();
    root.setAttribute('data-fs-scrolling', '');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => root.removeAttribute('data-fs-scrolling'), FULLSCREEN.SCROLL_IDLE_MS);
  }, { passive: true });
  sync();
}

/** Các sự kiện chạm mà MapLibre dùng để "nhận" một cú kéo (và chặn trình duyệt cuộn trang). */
const MAP_TOUCH_EVENTS = ['touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;

/**
 * Chưa thu thanh: chặn các sự kiện chạm không tới được bản đồ (ở pha capture của `document`), để MapLibre không nhận cú kéo dọc và trình duyệt được cuộn
 * TRANG, tức Safari thu thanh. Chạm nhẹ vào ghim vẫn chạy vì trình duyệt tự sinh sự kiện chuột sau mỗi lần chạm. Đã thu thanh thì không chặn gì.
 */
function letPageScrollOverMaps(root: HTMLElement): void {
  const block = (event: Event): void => {
    if (root.hasAttribute('data-fs-collapsed')) return;
    if (event.target instanceof Element && event.target.closest('.tmroot')) event.stopPropagation();
  };
  for (const type of MAP_TOUCH_EVENTS) document.addEventListener(type, block, { capture: true, passive: true });
}

/**
 * Thử nghiệm "full" trong tab Safari iPhone: khi cờ `?fs=1` bật, đặt `data-fs` trên `<html>` để CSS cho TRANG cuộn nhẹ (app giữ cố định),
 * nhờ đó Safari tự thu thanh công cụ khi người dùng vuốt (lấy lại ~40 px); cú vuốt dọc đầu tiên ở bất kỳ đâu sẽ thu thanh. Chạy trước lần render đầu; mặc định tắt.
 */
export function initializeFullscreenExperiment(): void {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* URL vẫn hoạt động khi kho bị chặn. */ }
  if (!readUrlFlag(FULLSCREEN, window.location, storage)) return;
  document.documentElement.dataset['fs'] = FULLSCREEN.on;
  document.documentElement.style.setProperty('--fs-scroll-range', `${FULLSCREEN.SCROLL_RANGE_PX}px`);
  trackScroll(document.documentElement);
  letPageScrollOverMaps(document.documentElement);
}
