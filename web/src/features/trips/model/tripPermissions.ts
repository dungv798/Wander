import type { Trip, TripItem } from './trip.types.ts';

/**
 * Điều người đang xem được làm trên một chuyến (H3/H4, DR-021). Đây CHỈ để ẩn nút cho đỡ rối: quyền thật do máy chủ quyết định và vẫn
 * trả 403 nếu giao diện lỡ cho bấm.
 */
export interface TripPermissions {
  /** Là Organizer (chủ chuyến). */
  readonly organizer: boolean;
  /** Sửa chuyến, mời người, gỡ người, xóa chuyến, duyệt đề nghị. */
  readonly manageTrip: boolean;
  /** Xếp ngày/thứ tự (lệnh lịch): chỉ Organizer. */
  readonly schedule: boolean;
  /** Xóa vĩnh viễn mục ở "Đã xóa gần đây": chỉ Organizer. */
  readonly purge: boolean;
  /** Sửa/xóa/khôi phục một mục: Organizer mọi mục, thành viên chỉ mục do mình thêm. */
  readonly canChange: (item: TripItem) => boolean;
}

/** Quyền của người đang xem chuyến; thiếu mã thành viên của mình thì thành viên không sửa được mục nào. */
export function permissionsOf(trip: Pick<Trip, 'role' | 'selfMemberId'>): TripPermissions {
  const organizer = trip.role === 'organizer';
  return {
    organizer,
    manageTrip: organizer,
    schedule: organizer,
    purge: organizer,
    canChange: (item) => organizer || (trip.selfMemberId !== null && item.addedBy === trip.selfMemberId),
  };
}
