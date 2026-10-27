/** Giới hạn nghiệp vụ. PHẢI khớp backend (docs/ux/data-needs.md §4, backend/src/main/java/com/wander/**). Đơn vị tiền: nghìn đồng (D17). */
export const LIMITS = {
  MAX_TRIP_DAYS: 366,
  MAX_TRIP_NAME: 120,
  MAX_ITEM_TITLE: 200,
  MAX_ITEM_NOTE: 2000,
  MAX_REASON: 200,
  MAX_DURATION_MIN: 10080,
  MAX_STYLES: 5,
  MAX_MONEY_THOUSAND: 1_000_000_000,
  MAX_MONEY_DIGITS: 10,
  MAX_DISPLAY_NAME: 40,
  /** Số mục tối đa trong "Đã xóa gần đây" của một chuyến (giữ đến khi xóa tay nên cần trần; khớp backend khi có). */
  MAX_TRASH: 500,
  /** Số lần thử hậu tố " - n" khi tên chuyến trùng (DR-006). */
  MAX_NAME_SUFFIX: 200,
} as const;

/** Mã khôi phục: 30 ký hiệu Crockford, 6 nhóm × 5 (≈150 bit), như `Secrets.newRecoveryCode()` của backend. */
export const RECOVERY_CODE = {
  ALPHABET: '0123456789ABCDEFGHJKMNPQRSTVWXYZ',
  LENGTH: 30,
  GROUP_SIZE: 5,
  GROUP_COUNT: 6,
  /** Số nhóm hệ thống chọn ngẫu nhiên để người dùng nhập lại khi xác nhận đã lưu (DR-018 B3). */
  CHALLENGE_GROUPS: 2,
  SEPARATOR: '-',
} as const;

/** Mã ghép thiết bị và mã duyệt: 8 ký hiệu Crockford, hiện dạng XXXX-XXXX. */
export const PAIRING_CODE = { LENGTH: 8, GROUP_SIZE: 4 } as const;
