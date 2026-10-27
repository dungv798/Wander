import { fill } from '../const/copy.vi.ts';
import { AGO_COPY as A } from '../const/time.copy.ts';

/** Số mili giây của một phút/giờ/ngày. */
const MS = { MINUTE: 60_000, HOUR: 3_600_000, DAY: 86_400_000 } as const;

/** "vừa xong / 5 phút trước / 2 giờ trước / 3 ngày trước" cho một thời điểm quá khứ; đồng hồ lệch về tương lai không âm. */
export function agoText(at: number, now: number): string {
  const d = Math.max(0, now - at);
  if (d < MS.MINUTE) return A.now;
  if (d < MS.HOUR) return fill(A.minutes, { n: Math.floor(d / MS.MINUTE) });
  if (d < MS.DAY) return fill(A.hours, { n: Math.floor(d / MS.HOUR) });
  return fill(A.days, { n: Math.floor(d / MS.DAY) });
}
