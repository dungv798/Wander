import { FULLSCREEN } from '../shared/const/fullscreen.const.ts';
import { readUrlFlag } from '../shared/lib/urlFlag.ts';

/**
 * Thử nghiệm "full" trong tab Safari iPhone: khi cờ `?fs=1` bật, đặt `data-fs` trên `<html>` để CSS cho TRANG cuộn nhẹ (app giữ cố định),
 * nhờ đó Safari tự thu thanh công cụ khi người dùng vuốt (lấy lại ~40 px). Chạy trước lần render đầu; mặc định tắt.
 */
export function initializeFullscreenExperiment(): void {
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* URL vẫn hoạt động khi kho bị chặn. */ }
  if (!readUrlFlag(FULLSCREEN, window.location, storage)) return;
  document.documentElement.dataset['fs'] = FULLSCREEN.on;
  document.documentElement.style.setProperty('--fs-scroll-range', `${FULLSCREEN.SCROLL_RANGE_PX}px`);
}
