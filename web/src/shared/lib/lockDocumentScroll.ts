let locks = 0;
let restore: (() => void) | null = null;

/**
 * Locks the background scroll with `overflow: hidden` on <html> and <body>; it does not change `position` so the scroll position is kept, no restoring needed.
 * (The earlier version used `body { position: fixed }`: it crashed WebKit on Windows when opening a place detail and easily made the Safari bar jump.)
 * Nested layers (map + dialog) unlock only when the last layer closes. Needs Safari iOS 16+ for `overflow: hidden` to block touch scrolling.
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
