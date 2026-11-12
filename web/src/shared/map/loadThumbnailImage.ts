import type { Map as MlMap } from 'maplibre-gl';

/**
 * A same-origin photo uses MapLibre's loader. An external photo uses an Image + anonymous CORS, going through the allowed img-src,
 * it makes no fetch that connect-src would block and sends no login information to the photo provider.
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
