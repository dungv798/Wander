import { MAP } from './map.const.ts';
import { MAP_PHOTO_CDN } from './mapThumbnailUrl.const.ts';
import { CATALOG_THUMBNAILS } from './catalogThumbnails.const.ts';

/** Ảnh ghim 96 px: dùng biến thể local có băm hoặc CDN đã biết; giữ ghi nhận nguồn và không đoán URL cho ảnh chưa biên mục. */
export function mapThumbnailUrl(source: string): string {
  const local = /^\/catalog\/photos\/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png))$/.exec(source);
  const thumbnail = local?.[1] ? CATALOG_THUMBNAILS.get(local[1]) : undefined;
  if (thumbnail) return `/assets/map-photos/${thumbnail}`;
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || url.hostname !== MAP_PHOTO_CDN.HOST) return source;
    url.searchParams.set('w', String(MAP.THUMB_PX));
    url.searchParams.set('h', String(MAP.THUMB_PX));
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('q', String(MAP_PHOTO_CDN.QUALITY));
    return url.toString();
  } catch { return source; }
}
