import { useEffect, useRef } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { IMAGE_SIZE, MOTION } from './motion.const.ts';

/** Giải mã ảnh trước khi hiện; hủy hiệu ứng và bỏ qua ảnh cũ khi đổi nguồn hoặc tháo thành phần. */
export function useImageReveal(src: string | undefined) {
  const ref = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const image = ref.current;
    if (!image) return;
    let active = true;
    let animation: Animation | undefined;
    image.dataset['imageReady'] = 'false';
    /** Chỉ hiện nguồn còn gắn với thành phần sau decode, kể cả bộ nhớ đệm hoặc trình duyệt thiếu decode. */
    const reveal = async (): Promise<void> => {
      try { await image.decode?.(); } catch { /* Ảnh lỗi vẫn giữ khung; không để promise bị bỏ quên. */ }
      if (!active || !image.complete || !image.naturalWidth) return;
      image.dataset['imageReady'] = 'true';
      if (!window.matchMedia(MOTION.REDUCED_QUERY).matches && !image.style.viewTransitionName && image.animate) {
        animation = image.animate([{ opacity: 0 }, { opacity: getComputedStyle(image).opacity }], { duration: MOTION.REVEAL_MS, easing: MOTION.EASING });
      }
    };
    image.addEventListener('load', reveal, { once: true });
    if (image.complete) void reveal();
    return () => { active = false; animation?.cancel(); image.removeEventListener('load', reveal); };
  }, [src]);
  return ref;
}

/** Ảnh giữ kích thước nội tại từ lúc tải; lớp CSS hiện có tiếp tục quyết định khung và cách cắt. */
export function RevealImage({ src, alt = '', width = IMAGE_SIZE.WIDTH, height = IMAGE_SIZE.HEIGHT, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const ref = useImageReveal(src);
  return <img {...props} alt={alt} ref={ref} src={src} width={width} height={height} />;
}
