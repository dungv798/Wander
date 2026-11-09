/** Trình duyệt trên iPhone/iPod/iPad là Safari (không phải Chrome, Firefox, Edge, Opera, ứng dụng Google trên iOS): nơi có thanh công cụ Safari thu lại khi trang cuộn. */
export function isIosSafari(userAgent: string): boolean {
  const ios = /iPhone|iPad|iPod/.test(userAgent);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\//.test(userAgent);
  return ios && /Safari\//.test(userAgent) && !otherBrowser;
}

/** Tín hiệu cho biết trang chạy như ứng dụng web đã thêm vào màn hình chính: `display-mode: standalone` (mọi trình duyệt) hoặc `navigator.standalone` (Safari iOS). */
export interface StandaloneSignals {
  readonly displayModeStandalone: boolean;
  readonly navigatorStandalone: boolean | undefined;
}

/** Trang đang chạy như ứng dụng web đã thêm vào màn hình chính (không có thanh trình duyệt). */
export function isStandalone(signals: StandaloneSignals): boolean {
  return signals.displayModeStandalone || signals.navigatorStandalone === true;
}
