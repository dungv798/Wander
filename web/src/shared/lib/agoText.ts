import { fill } from '../const/copy.vi.ts';
import { AGO_COPY as A } from '../const/time.copy.ts';

/** The number of milliseconds in a minute/hour/day. */
const MS = { MINUTE: 60_000, HOUR: 3_600_000, DAY: 86_400_000 } as const;

/** 'just now / 5 minutes ago / 2 hours ago / 3 days ago' for a past instant; a clock skewed into the future is not negative. */
export function agoText(at: number, now: number): string {
  const d = Math.max(0, now - at);
  if (d < MS.MINUTE) return A.now;
  if (d < MS.HOUR) return fill(A.minutes, { n: Math.floor(d / MS.MINUTE) });
  if (d < MS.DAY) return fill(A.hours, { n: Math.floor(d / MS.HOUR) });
  return fill(A.days, { n: Math.floor(d / MS.DAY) });
}
