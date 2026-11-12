import { MAP } from './map.const.ts';
import type { Pt } from './map.types.ts';

const ARC_STEPS = 24;
const HALF = 2;
const HALF_TURN_DEG = 180;
const DEG_TO_RAD = Math.PI / HALF_TURN_DEG;

/**
 * A gentle arc connecting two points [longitude, latitude]: a quadratic curve whose control point is offset perpendicular by `MAP.ARC_CURVE` x the length, sampled in `steps` segments.
 * Computed in the local plane (longitude multiplied by cos latitude) so the curvature is not distorted at Vietnam's latitude. Also returns the arc's midpoint (to place the km label).
 * Two coincident points give a degenerate but finite line (no division by 0).
 */
export function arcBetween(a: Pt, b: Pt, steps: number = ARC_STEPS): { line: Pt[]; mid: Pt } {
  const k = Math.cos(((a[1] + b[1]) / HALF) * DEG_TO_RAD);
  const [ax, ay, bx, by] = [a[0] * k, a[1], b[0] * k, b[1]];
  const [dx, dy] = [bx - ax, by - ay];
  const len = Math.hypot(dx, dy) || 1;
  const offset = MAP.ARC_CURVE * len;
  const cx = (ax + bx) / HALF - (dy / len) * offset;
  const cy = (ay + by) / HALF + (dx / len) * offset;
  /** The point on the arc at parameter t in [0, 1], converted back to longitude/latitude. */
  const at = (t: number): Pt => {
    const u = 1 - t;
    return [(u * u * ax + HALF * u * t * cx + t * t * bx) / k, u * u * ay + HALF * u * t * cy + t * t * by];
  };
  return { line: Array.from({ length: steps + 1 }, (_, i) => at(i / steps)), mid: at(1 / HALF) };
}

/** A route through several points [longitude, latitude]: consecutive arcs; `mids[i]` is the midpoint of the i-th arc. Fewer than two points gives empty. */
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
