/** Thử nghiệm "full" trong tab Safari iPhone (PO chọn 09/11/2026): bật bằng `?fs=1`, tắt bằng `?fs=0`; xem docs/implementation/decisions.md. */
export const FULLSCREEN = {
  param: 'fs',
  storageKey: 'wander.web.fs.v1',
  on: '1',
  off: '0',
  /** Khoảng trang cuộn được (px) thêm vào ngoài chiều cao khung nhìn: đủ để một cú vuốt làm Safari thu thanh. */
  SCROLL_RANGE_PX: 120,
} as const;
