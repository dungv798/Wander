import { flushSync } from 'react-dom';
import { MOTION } from './motion.const.ts';

export interface PhotoOrigin {
  readonly element: HTMLElement | null;
  readonly rect: DOMRect;
  readonly url: string;
  readonly position?: string;
}

let cancelCurrent = (): void => undefined;

/** Chọn chiến lược theo khả năng thực tế; giảm chuyển động luôn cập nhật tức thời. */
export function photoTransitionMode(reduced: boolean, viewTransitions: boolean, waapi: boolean): 'none' | 'view' | 'flip' {
  return reduced ? 'none' : viewTransitions ? 'view' : waapi ? 'flip' : 'none';
}

/** Chụp khung ảnh đang xem trước khi React thay DOM, không đổi focus của nút mở. */
export function photoOrigin(image: HTMLImageElement | null): PhotoOrigin | null {
  return image ? { element: image, rect: image.getBoundingClientRect(), url: image.getAttribute('src') ?? '', position: getComputedStyle(image).objectPosition } : null;
}

/** Chọn đúng ảnh đang nằm trong khung cuộn khi đóng, kể cả người dùng đã chuyển ảnh. */
export function galleryPhotoOrigin(): PhotoOrigin | null {
  const gallery = document.querySelector<HTMLElement>('.panel .gallery');
  if (!gallery) return null;
  const index = Math.round(gallery.scrollLeft / Math.max(1, gallery.clientWidth));
  return photoOrigin(gallery.querySelectorAll('img')[index] ?? null);
}

/** Dựng ảnh bay độc lập để FLIP và ghim canvas dùng chung đúng hình học nguồn. */
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

/** Thu phóng ảnh nguồn sang đích; cập nhật DOM đồng bộ để cơ chế focus của Sheet giữ nguyên. */
export function transitionPhoto(origin: PhotoOrigin | null, update: () => void, destination: () => PhotoOrigin | null): void {
  cancelCurrent();
  const mode = photoTransitionMode(window.matchMedia(MOTION.REDUCED_QUERY).matches, typeof document.startViewTransition === 'function', typeof Element.prototype.animate === 'function');
  if (!origin || mode === 'none' || origin.rect.width <= 0) { update(); return; }
  const source = origin.element?.isConnected ? origin.element : proxy(origin);
  /** Gỡ mọi dấu chuyển tiếp dù API bị bỏ qua hoặc người dùng đóng liên tiếp. */
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
    /** Chỉ dọn một lần để thao tác đóng nhanh không xóa dấu của chuyển tiếp kế tiếp. */
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
  /** Trả ảnh đích về luồng hiển thị cả khi người dùng đổi hướng giữa chừng. */
  const finish = (): void => { flying.remove(); if (target) target.style.visibility = ''; cleanup(); };
  cancelCurrent = () => { animation.cancel(); finish(); };
  void animation.finished.catch(() => undefined).finally(finish);
}
