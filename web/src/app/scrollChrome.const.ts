/** Thuộc tính trên <html> khi thanh trên/dưới đang trượt ra ngoài (CSS đọc nó ở mobile.css). */
export const CHROME_ATTR = 'data-chrome';
export const CHROME_HIDDEN = 'hidden';

/** Ngưỡng cuộn (px) cho việc ẩn/hiện thanh trên/dưới; có độ trễ để vuốt run tay không làm nhấp nháy. */
export const SCROLL_CHROME = {
  /** Dưới ngưỡng này (gần đầu trang) thanh luôn hiện. */
  ALWAYS_SHOW_ABOVE_PX: 120,
  /** Phải cuộn xuống thêm bấy nhiêu từ điểm đảo chiều mới ẩn. */
  HIDE_AFTER_DOWN_PX: 48,
  /** Chỉ cần cuộn lên bấy nhiêu từ điểm đảo chiều là hiện lại. */
  SHOW_AFTER_UP_PX: 20,
  /** Cách đáy trang (px) trở xuống thì hiện thanh để chạm được tab khi đã cuộn hết. */
  ALWAYS_SHOW_NEAR_END_PX: 24,
} as const;
