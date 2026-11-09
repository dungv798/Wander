/** "Full" trong tab Safari iPhone (PO chọn 09/11/2026; mặc định bật trên Safari iOS 09/11/2026): `?fs=1` ép bật, `?fs=0` ép tắt (đều được nhớ); xem docs/implementation/decisions.md. */
export const FULLSCREEN = {
  param: 'fs',
  storageKey: 'wander.web.fs.v1',
  on: '1',
  off: '0',
  /** Khoảng trang cuộn được (px) thêm vào ngoài chiều cao khung nhìn: đủ để một cú vuốt làm Safari thu thanh. */
  SCROLL_RANGE_PX: 120,
  /** Trang đã cuộn quá mức này (px) thì coi như Safari đã thu thanh: trả cử chỉ cho bản đồ và tờ. Về dưới mức này (thanh bung lại) thì lại nhường vuốt dọc cho trang. */
  COLLAPSED_SCROLL_PX: 32,
  /** Sau chừng này (ms) không còn cuộn thì coi như thanh đã ngừng co: bật lại kính mờ. */
  SCROLL_IDLE_MS: 160,
} as const;
