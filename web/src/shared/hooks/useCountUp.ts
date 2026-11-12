import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './useMediaQuery.ts';

const DEFAULT_DURATION_MS = 900;
const EASE_POWER = 3;

/** Counts from 0 up to `target` in `durationMs` (ease-out). With reduced motion it returns `target` at once. */
export function useCountUp(target: number, durationMs: number = DEFAULT_DURATION_MS): number {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduced) return undefined;
    const start = performance.now();
    let frame = 0;
    /** One animation step: computes the progress by real time, draws and then schedules the next step. */
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
