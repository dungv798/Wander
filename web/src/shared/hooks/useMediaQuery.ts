import { useCallback, useSyncExternalStore } from 'react';
import { MEDIA } from '../const/app.const.ts';

/** Theo dõi một truy vấn media (ví dụ màn rộng); render lại khi kết quả đổi. Phía máy chủ/không có `matchMedia` thì trả `false`. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    /** Đăng ký nghe thay đổi của truy vấn. */
    (onChange: () => void) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    /** Kết quả hiện tại của truy vấn. */
    () => window.matchMedia(query).matches,
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Màn rộng (≥ 768 px): thanh bên thay thanh tab, hero khác. */
export function useIsWide(): boolean {
  return useMediaQuery(MEDIA.WIDE);
}

/** Người dùng yêu cầu giảm chuyển động: tắt hoạt họa không cần thiết (a11y). */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery(MEDIA.REDUCED_MOTION);
}
