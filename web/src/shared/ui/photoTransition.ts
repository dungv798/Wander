import { flushSync } from 'react-dom';
import { MOTION } from './motion.const.ts';

export interface PhotoOrigin {
  readonly element: HTMLElement | null;
  readonly rect: DOMRect;
  readonly url: string;
  readonly position?: string;
}

let cancelCurrent = (): void => undefined;

/** Chooses the strategy by real capability; reduced motion always updates instantly. */
export function photoTransitionMode(reduced: boolean, viewTransitions: boolean, waapi: boolean): 'none' | 'view' | 'flip' {
  return reduced ? 'none' : viewTransitions ? 'view' : waapi ? 'flip' : 'none';
}

/** Captures the photo frame being viewed before React replaces the DOM, without changing the focus of the open button. */
export function photoOrigin(image: HTMLImageElement | null): PhotoOrigin | null {
  return image ? { element: image, rect: image.getBoundingClientRect(), url: image.getAttribute('src') ?? '', position: getComputedStyle(image).objectPosition } : null;
}

/** Picks exactly the photo that is in the scroll frame when closing, even if the user has switched photos. */
export function galleryPhotoOrigin(): PhotoOrigin | null {
  const gallery = document.querySelector<HTMLElement>('.panel .gallery');
  if (!gallery) return null;
  const index = Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth));
  return photoOrigin(gallery.querySelectorAll('img')[index] ?? null);
}

/** Builds an independent flying photo so FLIP and the canvas pin share the exact source geometry. */
function proxy(origin: PhotoOrigin): HTMLImageElement {
  const image = document.createElement('img');
  image.src = origin.url;
  image.alt = '';
  image.className = 'photo-flight';
  image.setAttribute('aria-hidden', 'true');
  Object.assign(image.style, { left: `${origin.rect.left}px`, top: `${origin.rect.top}px`, width: `${origin.rect.width}px`, height: `${origin.rect.height}px`, objectPosition: origin.position ?? 'center' });
  document.body.append(image);
  return image;
}

/** Scales the source photo to the target; updates the DOM synchronously so the Sheet's focus mechanism is kept. */
export function transitionPhoto(origin: PhotoOrigin | null, update: () => void, destination: () => PhotoOrigin | null): void {
  cancelCurrent();
  const mode = photoTransitionMode(window.matchMedia(MOTION.REDUCED_QUERY).matches, typeof document.startViewTransition === 'function', typeof Element.prototype.animate === 'function');
  if (!origin || mode === 'none' || origin.rect.width <= 0) { update(); return; }
  const source = origin.element?.isConnected ? origin.element : proxy(origin);
  /** Removes every transition mark even if the API is skipped or the user closes in quick succession. */
  const cleanup = (): void => { source.style.viewTransitionName = ''; if (source.classList.contains('photo-flight')) source.remove(); };
  if (mode === 'view') {
    source.style.viewTransitionName = MOTION.NAME;
    let target: HTMLElement | null = null;
    let cancelled = false;
    const transition = document.startViewTransition(() => {
      if (cancelled) return;
      cleanup();
      flushSync(update);
      const next = destination();
      target = next?.element?.isConnected ? next.element : next ? proxy(next) : null;
      if (target) {
        target.style.viewTransitionName = MOTION.NAME;
        if (target instanceof HTMLImageElement && target.complete && target.naturalWidth) target.dataset['imageReady'] = 'true';
      }
    });
    let cleaned = false;
    /** Cleans up only once so a fast close action does not erase the mark of the next transition. */
    const finish = (): void => {
      if (cleaned) return;
      cleaned = true;
      cleanup();
      if (target) { target.style.viewTransitionName = ''; if (target.classList.contains('photo-flight')) target.remove(); }
    };
    cancelCurrent = () => { cancelled = true; transition.skipTransition(); finish(); };
    void transition.ready.catch(() => undefined);
    void transition.updateCallbackDone.catch(() => undefined);
    void transition.finished.catch(() => undefined).finally(finish);
    return;
  }
  flushSync(update);
  const next = destination();
  if (!next) { cleanup(); return; }
  const flying = proxy(origin);
  const target = next.element;
  if (target) target.style.visibility = 'hidden';
  const animation = flying.animate([
    { transform: 'none' },
    { transform: `translate(${next.rect.left - origin.rect.left}px, ${next.rect.top - origin.rect.top}px) scale(${next.rect.width / origin.rect.width}, ${next.rect.height / origin.rect.height})` },
  ], { duration: MOTION.DURATION_MS, easing: MOTION.EASING });
  /** Returns the target photo to the display flow even if the user changes direction midway. */
  const finish = (): void => { flying.remove(); if (target) target.style.visibility = ''; cleanup(); };
  cancelCurrent = () => { animation.cancel(); finish(); };
  void animation.finished.catch(() => undefined).finally(finish);
}
