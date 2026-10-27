import { useEffect, useState } from 'react';

/** Giờ hiện tại (mili giây) cập nhật mỗi `intervalMs`; dùng cho đếm ngược/hết hạn mà không gọi `Date.now()` trong lúc render. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
