import { useEffect, useState } from 'react';

/** Trả `true` sau `ms` mili giây kể từ lúc thành phần hiện ra (và về `false` khi nó bị gỡ rồi dựng lại); dùng cho thông báo "tải lâu". */
export function useAfterDelay(ms: number): boolean {
  const [elapsed, setElapsed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setElapsed(true), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return elapsed;
}
