import type { TripItem } from './trip.types.ts';

/** Mục địa điểm có liên kết kho, không gồm Nghỉ hoặc Việc cần làm dù chúng mang liên kết. */
export function isPlaceItem(item: TripItem): boolean {
  return item.placeId !== null && item.type !== 'rest' && item.type !== 'task';
}

/** Khớp quy tắc endpoint done: việc cần làm hoặc địa điểm, không phụ thuộc người thêm mục. */
export function canCompleteItem(item: TripItem): boolean {
  return item.type === 'task' || isPlaceItem(item);
}
