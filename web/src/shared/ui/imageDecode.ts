import { MOTION } from './motion.const.ts';

/** Waits for the original img itself so the browser still decides lazy loading; removes the listener when the component leaves or the request changes. */
export async function decodeImageElement(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  if (!image.complete) await new Promise<void>((resolve, reject) => {
    /** Cleans up the load, error and cancel listeners, avoiding holding a lazy image that has left the screen. */
    const clean = (): void => { image.removeEventListener('load', loaded); image.removeEventListener('error', failed); signal.removeEventListener('abort', failed); };
    const loaded = (): void => { clean(); resolve(); };
    const failed = (): void => { clean(); reject(new Error(MOTION.DECODE_ERROR)); };
    image.addEventListener('load', loaded, { once: true });
    image.addEventListener('error', failed, { once: true });
    signal.addEventListener('abort', failed, { once: true });
  });
  if (!image.naturalWidth || signal.aborted) throw new Error(MOTION.DECODE_ERROR);
  await image.decode?.();
}

/** Decodes outside the DOM before changing the photo being viewed; it keeps no large bitmap cache of its own. */
export async function decodeImage(source: string): Promise<void> {
  const image = new Image();
  image.decoding = 'async';
  if (image.decode) {
    image.src = source;
    await image.decode();
    return;
  }
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(MOTION.DECODE_ERROR));
    image.src = source;
  });
}
