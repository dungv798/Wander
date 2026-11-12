/** Waits for asynchronous content to become tall enough to restore the position; stops immediately when the user acts on their own. */
export function restoreDocumentPosition(top: number): () => void {
  const observer = new ResizeObserver(sync);
  const events = ['touchstart', 'wheel', 'keydown', 'pointerdown'] as const;
  /** Does not keep pulling the page to the old position after it was restored or a new action happened. */
  function stop(): void {
    observer.disconnect();
    for (const event of events) window.removeEventListener(event, stop);
  }
  /** Loading more content can make the page tall enough to return to exactly the card that was viewed. */
  function sync(): void {
    window.scrollTo({ top, behavior: 'instant' });
    if (Math.abs(window.scrollY - top) < 1) stop();
  }
  observer.observe(document.body);
  for (const event of events) window.addEventListener(event, stop, { passive: true, once: true });
  sync();
  return stop;
}
