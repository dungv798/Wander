import type { Trip } from './trip.types.ts';

/** Đọc lại cùng nội dung sau lỗi mạng không làm mất bản nháp; đổi ngày, mục hoặc quyền thì phải tính lại. */
export function planDraftKey(trip: Trip): string {
  return JSON.stringify([trip.id, trip.destinationId, trip.startDate, trip.endDate, trip.role, trip.items]);
}
