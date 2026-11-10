/** Chờ nội dung bất đồng bộ đủ cao để khôi phục vị trí; dừng ngay khi người dùng tự thao tác. */
export function restoreDocumentPosition(top: number): () => void {
  const observer = new ResizeObserver(sync);
  const events = ['touchstart', 'wheel', 'keydown', 'pointerdown'] as const;
  /** Không tiếp tục kéo trang về vị trí cũ sau khi đã khôi phục hoặc có thao tác mới. */
  function stop(): void {
    observer.disconnect();
    for (const event of events) window.removeEventListener(event, stop);
  }
  /** Nạp thêm nội dung có thể làm trang đủ cao để trở lại đúng thẻ đã xem. */
  function sync(): void {
    window.scrollTo({ top, behavior: 'instant' });
    if (Math.abs(window.scrollY - top) < 1) stop();
  }
  observer.observe(document.body);
  for (const event of events) window.addEventListener(event, stop, { passive: true, once: true });
  sync();
  return stop;
}
