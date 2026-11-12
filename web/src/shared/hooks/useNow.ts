import { useEffect, useState } from 'react';

/** The current time (milliseconds) updated every `intervalMs`; used for countdowns/expiry without calling `Date.now()` during render. */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
}
