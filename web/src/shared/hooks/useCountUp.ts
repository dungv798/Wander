import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery.ts';

const DEFAULT_DURATION_MS = 900;
const EASE_POWER = 3;

/** Đếm từ 0 lên `target` trong `durationMs` (ease-out). Giảm chuyển động thì trả `target` ngay. */
export function useCountUp(target: number, durationMs: number = DEFAULT_DURATION_MS): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const start = performance.now();
    let frame = 0;
    /** Một bước hoạt họa: tính tiến độ theo thời gian thật, vẽ rồi hẹn bước sau. */
    const step = (now: number): void => {
      const k = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(target * (1 - (1 - k) ** EASE_POWER)));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs, reduced]);
  return reduced ? target : value;
}
