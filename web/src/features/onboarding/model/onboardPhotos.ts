import type { PlaceView } from '../../discover/index.ts';
import { DESTINATION_PHOTOS, PLACE_PHOTO_INDEX } from './onboarding.const.ts';

/** Ảnh dùng cho một địa điểm trong phần giới thiệu: ảnh biên tập đã chọn là nét và rực nhất (theo `PLACE_PHOTO_INDEX`), mặc định ảnh đầu. Chuỗi rỗng nếu địa điểm không có ảnh. */
export function onboardPhotoUrl(place: PlaceView): string {
  const wanted = PLACE_PHOTO_INDEX[place.id];
  return (wanted === undefined ? undefined : place.photos[wanted]?.url) ?? place.photos[0]?.url ?? '';
}

/** Ảnh và điểm lấy nét của thẻ điểm đến: ảnh đã chọn riêng nếu có, không thì ảnh bìa của kho. */
export function destinationPhoto(id: string, coverUrl: string): { readonly url: string; readonly position: string } {
  const chosen = DESTINATION_PHOTOS[id];
  return chosen ? { url: chosen.url, position: chosen.position } : { url: coverUrl, position: 'center' };
}
