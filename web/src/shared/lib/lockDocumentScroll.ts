let locks = 0;
let restore: (() => void) | null = null;

/**
 * Khóa cuộn nền bằng `overflow: hidden` trên <html> và <body>; không đổi `position` nên vị trí cuộn giữ nguyên, không cần khôi phục.
 * (Bản trước dùng `body { position: fixed }`: gây crash WebKit Windows khi mở chi tiết địa điểm và dễ làm thanh Safari nhảy.)
 * Các lớp lồng nhau (bản đồ + hộp thoại) chỉ mở khóa khi lớp cuối cùng đóng. Cần Safari iOS 16+ để `overflow: hidden` chặn cuộn cảm ứng.
 */
export function lockDocumentScroll(): () => void {
  if (locks === 0) {
    const { body, documentElement } = document;
    const previous = { rootOverflow: documentElement.style.overflow, bodyOverflow: body.style.overflow, rootOverscroll: documentElement.style.overscrollBehavior };
    documentElement.style.overflow = 'hidden';
    documentElement.style.overscrollBehavior = 'none';
    body.style.overflow = 'hidden';
    documentElement.setAttribute('data-scroll-locked', '');
    restore = () => {
      documentElement.style.overflow = previous.rootOverflow;
      documentElement.style.overscrollBehavior = previous.rootOverscroll;
      body.style.overflow = previous.bodyOverflow;
      documentElement.removeAttribute('data-scroll-locked');
    };
  }
  locks++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks--;
    if (locks === 0) { restore?.(); restore = null; }
  };
}
