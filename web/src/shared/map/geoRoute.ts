import { MAP } from './map.const.ts';
import type { Pt } from './map.types.ts';

const ARC_STEPS = 24;
const HALF = 2;
const HALF_TURN_DEG = 180;
const DEG_TO_RAD = Math.PI / HALF_TURN_DEG;

/**
 * Cung nhẹ nối hai điểm [kinh độ, vĩ độ]: đường cong bậc hai có điểm điều khiển lệch vuông góc `MAP.ARC_CURVE` × độ dài, lấy mẫu `steps` đoạn.
 * Tính trong mặt phẳng địa phương (kinh độ nhân cos vĩ độ) để độ cong không méo ở vĩ độ Việt Nam. Trả cả điểm giữa cung (đặt nhãn km).
 * Hai điểm trùng nhau cho đường suy biến nhưng hữu hạn (không chia cho 0).
 */
export function arcBetween(a: Pt, b: Pt, steps: number = ARC_STEPS): { line: Pt[]; mid: Pt } {
  const k = Math.cos(((a[1] + b[1]) / HALF) * DEG_TO_RAD);
  const [ax, ay, bx, by] = [a[0] * k, a[1], b[0] * k, b[1]];
  const [dx, dy] = [bx - ax, by - ay];
  const len = Math.hypot(dx, dy) || 1;
  const offset = MAP.ARC_CURVE * len;
  const cx = (ax + bx) / HALF - (dy / len) * offset;
  const cy = (ay + by) / HALF + (dx / len) * offset;
  /** Điểm trên cung ở tham số t trong [0, 1], quy lại kinh độ/vĩ độ. */
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [(u * u * ax + HALF * u * t * cx + t * t * bx) / k, u * u * ay + HALF * u * t * cy + t * t * by];
  };
  return { line: Array.from({ length: steps + 1 }, (_, i) => at(i / steps)), mid: at(1 / HALF) };
}

/** Tuyến qua nhiều điểm [kinh độ, vĩ độ]: các cung nối tiếp; `mids[i]` là điểm giữa cung thứ i. Ít hơn hai điểm thì rỗng. */
export function routeArcs(points: readonly Pt[]): { lines: Pt[][]; mids: Pt[] } {
  const lines: Pt[][] = [];
  const mids: Pt[] = [];
  points.forEach((p, i) => {
    const q = points[i - 1];
    if (!q) return;
    const arc = arcBetween(q, p);
    lines.push(arc.line);
    mids.push(arc.mid);
  });
  return { lines, mids };
}
