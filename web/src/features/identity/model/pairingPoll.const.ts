/** Nhịp lùi cho mọi lỗi poll liên tiếp; đơn vị ms, không đổi hạn duyệt của máy chủ. */
export const PAIRING_POLL = {
  BACKOFF_FACTOR: 2,
  MAX_DELAY_MS: 30_000,
  RATE_LIMIT_STATUS: 429,
  VISIBILITY_EVENT: 'visibilitychange',
} as const;
