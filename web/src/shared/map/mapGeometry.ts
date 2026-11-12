import { MAP } from './map.const.ts';
import type { Pt, Size } from './map.types.ts';

/** A rectangle [x, y, width, height] on the screen. */
export type Box = readonly [number, number, number, number];

const HALF = 2;

/** A pin on the screen, the input of clustering. */
export interface ScreenPin {
  readonly id: string;
  readonly p: Pt;
  readonly s: Pt;
}

/** Groups close pins (< `thresholdPx` on screen): returns only groups with at least 2 pins, with the center in map coordinates. */
export function clusterPins(pins: readonly ScreenPin[], thresholdPx: number = MAP.CLUSTER_PX): { ids: string[]; p: Pt }[] {
  const used = new Set<string>();
  const out: { ids: string[]; p: Pt }[] = [];
  for (const a of pins) {
    if (used.has(a.id)) continue;
    const group = pins.filter((b) => !used.has(b.id) && Math.hypot(a.s[0] - b.s[0], a.s[1] - b.s[1]) < thresholdPx);
    if (group.length < HALF) continue;
    group.forEach((b) => used.add(b.id));
    out.push({ ids: group.map((b) => b.id), p: [group.reduce((t, b) => t + b.p[0], 0) / group.length, group.reduce((t, b) => t + b.p[1], 0) / group.length] });
  }
  return out;
}

/** Whether two rectangles overlap (including the padding `gap`). */
function overlaps(a: Box, b: Box, gap: number): boolean {
  return a[0] < b[0] + b[2] + gap && a[0] + a[2] + gap > b[0] && a[1] < b[1] + b[3] + gap && a[1] + a[3] + gap > b[1];
}

/** A label to place: the pin's center on the screen and the measured label size. */
export interface LabelRequest {
  readonly id: string;
  readonly at: Pt;
  readonly w: number;
  readonly h: number;
}

/**
 * Places non-overlapping labels by priority: tries right, left, below, above the pin; a position that is inside the frame and does not
 * touch a pin/label already placed is accepted. A label with no room has no entry in the result (hidden).
 */
export function placeLabels(requests: readonly LabelRequest[], pinBoxes: readonly Box[], size: Size): { placed: Map<string, Pt>; boxes: Box[] } {
  const placed = new Map<string, Pt>();
  const boxes: Box[] = [];
  const E = MAP.EDGE_PAD;
  for (const r of requests) {
    const [x, y] = r.at;
    const tries: Pt[] = [
      [x + MAP.LABEL_X, y - r.h / HALF],
      [x - MAP.LABEL_X - r.w, y - r.h / HALF],
      [x - r.w / HALF, y + MAP.LABEL_Y],
      [x - r.w / HALF, y - MAP.LABEL_Y - r.h],
    ];
    const ok = tries.find(([bx, by]) => bx > E && by > E && bx + r.w < size.w - E && by + r.h < size.h - E && ![...boxes, ...pinBoxes].some((o) => overlaps([bx, by, r.w, r.h], o, MAP.LABEL_GAP)));
    if (!ok) continue;
    placed.set(r.id, ok);
    boxes.push([ok[0], ok[1], r.w, r.h]);
  }
  return { placed, boxes };
}

/** The box occupied by a pin or a cluster pin around the screen center. */
export function pinBox(at: Pt, half: number): Box {
  return [at[0] - half, at[1] - half, half * HALF, half * HALF];
}
