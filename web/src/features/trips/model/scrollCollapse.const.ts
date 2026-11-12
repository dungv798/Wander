/** Ngưỡng (px) thu gọn đầu tờ chuyến khi cuộn danh sách lịch (B-01, DR-037). */
export const COLLAPSE = {
  /** Cuộn quá mức này thì thu gọn đầu tờ. */
  AT_PX: 40,
  /** Chỉ mở lại khi cuộn về gần đầu; thấp hơn `AT_PX` để có độ trễ, tránh nhấp nháy. */
  EXPAND_AT_PX: 4,
  /** Phải còn ít nhất chừng này chỗ cuộn thì mới thu gọn: thu gọn làm vùng cuộn nở ra, nội dung ngắn sẽ bị kẹp về đầu rồi mở lại, lặp vô tận. */
  MIN_SCROLLABLE_PX: 200,
} as const;
