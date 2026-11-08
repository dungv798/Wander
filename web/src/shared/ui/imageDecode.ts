import { MOTION } from './motion.const.ts';

/** Chờ chính img ban đầu để browser vẫn quyết định lazy-load; hủy listener khi component rời hoặc đổi yêu cầu. */
export async function decodeImageElement(image: HTMLImageElement, signal: AbortSignal): Promise<void> {
  if (!image.complete) await new Promise<void>((resolve, reject) => {
    /** Dọn cả listener load, lỗi và hủy, tránh giữ ảnh lazy đã rời màn. */
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

/** Giải mã ngoài DOM trước khi đổi ảnh đang xem; không giữ cache bitmap lớn của riêng ứng dụng. */
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
