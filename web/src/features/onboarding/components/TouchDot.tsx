import type { TouchMark } from '../model/swipeDemo.ts';

/** Dấu chạm minh họa (vòng trắng + chấm), chỉ hiện khi câu chuyện đang "bấm" thay người xem; trang trí nên ẩn với trình đọc màn hình. */
export function TouchDot({ mark }: { readonly mark: TouchMark | null }) {
  if (!mark) return null;
  return <span className={`ob-touch${mark.press ? ' press' : ''}`} style={{ left: mark.x, top: mark.y }} aria-hidden="true" />;
}
