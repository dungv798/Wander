import { BEZIER_CONTROL_WEIGHT, BEZIER_END_WEIGHT } from '../const/math.const.ts';
import { MAP } from './map.const.ts';
import type { Camera, FitOptions, Insets, Pt, Size } from './map.types.ts';

/** Hình chữ nhật [x, y, rộng, cao] trên màn hình. */
export type Box = readonly [number, number, number, number];

const HALF = 2;
const EASE_CUBE = 3;
const EASE_IN_FACTOR = 4;

/** Hàm ease cho camera: chậm đầu, nhanh giữa, chậm cuối (t trong [0, 1]). */
export function mapEase(t: number): number {
  return t < 1 / HALF ? EASE_IN_FACTOR * t * t * t : 1 - (-HALF * t + HALF) ** EASE_CUBE / HALF;
}

/** Giữ camera trong vùng dữ liệu (kích thước ảnh nền) và trong khoảng zoom cho phép. */
export function clampCamera(c: Camera, bounds: Size, minScale: number): Camera {
  const s = Math.min(MAP.MAX_SCALE, Math.max(minScale, c.s));
  return { s, cx: Math.min(bounds.w, Math.max(0, c.cx)), cy: Math.min(bounds.h, Math.max(0, c.cy)) };
}

/** Tọa độ ảnh nền → tọa độ màn hình trong khung. */
export function toScreen(cam: Camera, size: Size, p: Pt): Pt {
  return [(p[0] - cam.cx) * cam.s + size.w / HALF, (p[1] - cam.cy) * cam.s + size.h / HALF];
}

/**
 * Mọi điểm đều nằm trong vùng nhìn thấy thật sự (khung trừ phần bị che, trừ thêm `margin` px mỗi cạnh)?
 * Danh sách rỗng trả false: không có gì để giữ lại nên người gọi cứ vừa khung như thường.
 */
export function allVisible(points: readonly Pt[], cam: Camera, size: Size, inset: Insets, margin: number): boolean {
  if (!points.length) return false;
  const [left, top] = [inset.left + margin, inset.top + margin];
  const [right, bottom] = [size.w - inset.right - margin, size.h - inset.bottom - margin];
  return points.every((p) => {
    const [x, y] = toScreen(cam, size, p);
    return x >= left && x <= right && y >= top && y <= bottom;
  });
}

/** Camera vừa khung một tập điểm (tính cả phần khung bị che); không có điểm thì trả null để gọi vừa khung toàn vùng. */
export function fitCamera(points: readonly Pt[], size: Size, inset: Insets, minScale: number, o: FitOptions = {}): Camera | null {
  if (!points.length) return null;
  const pad = o.padding ?? MAP.FIT_PADDING;
  const vw = size.w - inset.left - inset.right - pad * HALF;
  const vh = size.h - inset.top - inset.bottom - pad * HALF;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const fitS = Math.min(vw / Math.max(MAP.FIT_MIN_SPAN, maxX - minX), vh / Math.max(MAP.FIT_MIN_SPAN, maxY - minY));
  const s = Math.min(MAP.MAX_SCALE * (o.maxZoomFactor ?? MAP.FIT_MAX_FACTOR), Math.max(minScale, fitS));
  return { s, cx: (minX + maxX) / HALF - (inset.left - inset.right) / HALF / s, cy: (minY + maxY) / HALF - (inset.top - inset.bottom) / HALF / s };
}

/** Camera sau khi phóng/thu hệ số `f` quanh điểm màn hình (px, py), giữ nguyên điểm dưới con trỏ. */
export function zoomCamera(cam: Camera, size: Size, f: number, px: number, py: number, minScale: number): Camera {
  const s = Math.min(MAP.MAX_SCALE, Math.max(minScale, cam.s * f));
  const k = cam.s / s;
  return { s, cx: cam.cx + ((px - size.w / HALF) / cam.s) * (1 - k), cy: cam.cy + ((py - size.h / HALF) / cam.s) * (1 - k) };
}

/** Một đoạn tuyến: đường cong bậc hai, điểm giữa (để đặt nhãn km) và chỉ số điểm đích. */
export interface ArcSegment {
  readonly d: string;
  readonly mid: Pt;
  readonly index: number;
}

/** Dựng các cung nhẹ nối các điểm liên tiếp và đường liền mạch của cả tuyến (cho chấm sáng chạy dọc). */
export function arcSegments(points: readonly Pt[]): { segs: ArcSegment[]; all: string } {
  const segs: ArcSegment[] = [];
  const first = points[0];
  let all = first ? `M${first[0]} ${first[1]}` : '';
  points.forEach((p, i) => {
    const q = points[i - 1];
    if (!q) return;
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    const len = Math.hypot(dx, dy) || 1;
    const k = MAP.ARC_CURVE * len;
    const mx = (p[0] + q[0]) / HALF - (dy / len) * k;
    const my = (p[1] + q[1]) / HALF + (dx / len) * k;
    segs.push({ d: `M${q[0]} ${q[1]} Q${mx} ${my} ${p[0]} ${p[1]}`, mid: [BEZIER_END_WEIGHT * q[0] + BEZIER_CONTROL_WEIGHT * mx + BEZIER_END_WEIGHT * p[0], BEZIER_END_WEIGHT * q[1] + BEZIER_CONTROL_WEIGHT * my + BEZIER_END_WEIGHT * p[1]], index: i });
    all += ` Q${mx} ${my} ${p[0]} ${p[1]}`;
  });
  return { segs, all };
}

/** Một ghim trên màn hình, đầu vào của việc gộp cụm. */
export interface ScreenPin {
  readonly id: string;
  readonly p: Pt;
  readonly s: Pt;
}

/** Nhóm ghim gần nhau (< `thresholdPx` trên màn hình): chỉ trả nhóm có ≥ 2 ghim, kèm tâm theo tọa độ bản đồ. */
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

/** Hai hình chữ nhật có chồng nhau (kể cả khoảng đệm `gap`) không. */
function overlaps(a: Box, b: Box, gap: number): boolean {
  return a[0] < b[0] + b[2] + gap && a[0] + a[2] + gap > b[0] && a[1] < b[1] + b[3] + gap && a[1] + a[3] + gap > b[1];
}

/** Nhãn cần đặt: tâm ghim trên màn hình và kích thước nhãn đã đo. */
export interface LabelRequest {
  readonly id: string;
  readonly at: Pt;
  readonly w: number;
  readonly h: number;
}

/**
 * Đặt nhãn không chồng nhau theo thứ tự ưu tiên: thử bên phải, bên trái, dưới, trên ghim; vị trí nào nằm trong khung và không
 * chạm ghim/nhãn đã đặt thì nhận. Nhãn không có chỗ thì không có mục trong kết quả (bị ẩn).
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

/** Tên thị trấn có đang đè lên ghim/nhãn gần đó không (để ẩn khi chật). */
export function townIsCrowded(at: Pt, boxes: readonly Box[]): boolean {
  return boxes.some(([ox, oy, ow, oh]) => at[0] > ox - MAP.TOWN_NEAR_X && at[0] < ox + ow + MAP.TOWN_NEAR_X && at[1] > oy - MAP.TOWN_NEAR_Y && at[1] < oy + oh + MAP.TOWN_NEAR_Y);
}

/** Hộp chiếm chỗ của một ghim hoặc ghim cụm quanh tâm màn hình. */
export function pinBox(at: Pt, half: number): Box {
  return [at[0] - half, at[1] - half, half * HALF, half * HALF];
}
