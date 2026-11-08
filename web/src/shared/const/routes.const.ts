/** Tên tuyến (màn) của ứng dụng. Giá trị trùng tên màn của prototype (`data-view`). */
export const VIEW = {
  EXPLORE: 'explore',
  DESTINATIONS: 'destinations',
  DEST: 'dest',
  DECK: 'deck',
  PICKED: 'picked',
  TRIPS: 'trips',
  TRIP: 'trip',
  ONBOARD: 'onboard',
  SECURITY: 'security',
  RECOVER: 'recover',
  EXPIRED: 'expired',
  SETTINGS: 'settings',
  TODAY: 'today',
  EXPORT: 'export',
  JOIN: 'join',
} as const;

/** Một tên màn hợp lệ. */
export type ViewName = (typeof VIEW)[keyof typeof VIEW];

/** Điểm đến dự phòng khi catalog chưa tải được. */
export const DEFAULT_DESTINATION_ID = 'ha-giang';

/** Màn ẩn thanh điều hướng trên điện thoại (khớp `renderTabs` của prototype). */
export const HIDE_TABBAR_ON_PHONE: readonly ViewName[] = [VIEW.ONBOARD, VIEW.DECK, VIEW.TODAY, VIEW.EXPORT];

/** Màn không có thanh điều hướng ở mọi cỡ. */
export const HIDE_TABBAR_ALWAYS: readonly ViewName[] = [VIEW.ONBOARD, VIEW.EXPIRED, VIEW.JOIN, VIEW.DESTINATIONS];
