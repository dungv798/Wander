import type { Map as MlMap } from 'maplibre-gl';

/**
 * Ảnh cùng origin dùng bộ tải MapLibre. Ảnh ngoài dùng Image + CORS ẩn danh, đi qua img-src đã cho phép,
 * không phát sinh fetch bị connect-src chặn và không gửi thông tin đăng nhập tới nhà cung cấp ảnh.
 */
export function loadThumbnailImage(map: Pick<MlMap, 'loadImage'>, url: string): Promise<HTMLImageElement | ImageBitmap> {
  if (!/^https?:\/\//i.test(url)) return map.loadImage(url).then(response => response.data);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Map photo could not be loaded'));
    image.src = url;
  });
}
