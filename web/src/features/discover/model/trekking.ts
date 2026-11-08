import type { PlaceView } from './Catalog.types.ts';

/** Mã loại "Leo núi / trekking" của kho biên tập (dùng chung chip, biểu tượng và quy tắc hiển thị). */
export const TREK_CATEGORY = 'leo';

/**
 * Nơi thuộc loại leo núi/trekking. Với loại này "cách bao xa" chỉ là khoảng cách THAM CHIẾU từ một mốc đến vị trí,
 * không được trình bày như tuyến leo, thời gian lên đỉnh hay thời gian chạy xe máy (không có GPX/tuyến trong kho).
 */
export function isTrek(place: Pick<PlaceView, 'category'>): boolean {
  return place.category === TREK_CATEGORY;
}
