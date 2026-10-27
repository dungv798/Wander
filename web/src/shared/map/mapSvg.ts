import { MAP } from './map.const.ts';
import type { ArcSegment } from './mapGeometry.ts';
import type { MapData, Pt } from './map.types.ts';

let colorCtx: CanvasRenderingContext2D | null = null;
const BYTE_MAX = 255;
const RGB_CHANNELS = 3;
const RAMP_DIGITS = 3;

/** Đọc một màu CSS bất kỳ (kể cả `var()` đã giải) thành [r, g, b] trong 0..1 bằng canvas 1×1. */
export function cssColorToRgb(css: string): [number, number, number] {
  colorCtx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!colorCtx) return [0, 0, 0];
  colorCtx.clearRect(0, 0, 1, 1);
  colorCtx.fillStyle = '#000';
  colorCtx.fillStyle = css;
  colorCtx.fillRect(0, 0, 1, 1);
  const d = colorCtx.getImageData(0, 0, 1, 1).data;
  return [(d[0] ?? 0) / BYTE_MAX, (d[1] ?? 0) / BYTE_MAX, (d[2] ?? 0) / BYTE_MAX];
}

/** Bảng tra màu cho một kênh (0=R, 1=G, 2=B) từ dải màu độ cao lấy ở token `--map-*` (đổi bộ màu thì bản đồ đổi theo). */
function channelTable(ramp: readonly (readonly number[])[], channel: number): string {
  return ramp.map((c) => (c[channel] ?? 0).toFixed(RAMP_DIGITS)).join(' ');
}

/** Dải màu độ cao hiện hành đọc từ token CSS trên phần tử `host`. */
export function readRamp(host: HTMLElement): [number, number, number][] {
  const cs = getComputedStyle(host);
  return MAP.RAMP_TOKENS.map((t) => cssColorToRgb(cs.getPropertyValue(t).trim()));
}

/** Thoát ký tự đặc biệt khi đưa chuỗi vào thuộc tính HTML/SVG (phòng thủ: dữ liệu bản đồ do dựng sẵn nhưng vẫn là đầu vào ngoài). */
function attr(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Một đa tuyến SVG từ danh sách điểm. */
function polyline(points: readonly Pt[], cls: string): string {
  return `<polyline class="${cls}" points="${points.map((p) => `${p[0]},${p[1]}`).join(' ')}"/>`;
}

/**
 * Nội dung SVG nền: ảnh độ cao tô theo dải màu thương hiệu, bóng núi, rồi sông và đường (chỉ nằm trong vùng có địa hình nhờ mặt nạ).
 * `uid` làm id bộ lọc/mặt nạ duy nhất khi có nhiều bản đồ trên một trang. Chỉ chứa số và địa chỉ tệp tin cậy.
 */
export function buildBaseSvg(data: MapData, uid: string, ramp: readonly (readonly number[])[]): string {
  const { meta, vectors } = data;
  const base = attr(data.base);
  const roads = vectors.roads.filter((r) => !MAP.NOISE_ROAD_NAME.test(r.n) && !MAP.CJK.test(r.n));
  const dim = `width="${meta.width}" height="${meta.height}" preserveAspectRatio="none"`;
  const filter = `<filter id="tmr-${uid}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues="${channelTable(ramp, 0)}"/><feFuncG type="table" tableValues="${channelTable(ramp, 1)}"/><feFuncB type="table" tableValues="${channelTable(ramp, RGB_CHANNELS - 1)}"/></feComponentTransfer></filter>`;
  const mask = `<mask id="tmm-${uid}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image href="${base}height.webp" ${dim}/></mask>`;
  const casing = roads.map((r) => `<polyline class="tm-road-casing k-${attr(r.k)}" points="${r.p.map((p) => `${p[0]},${p[1]}`).join(' ')}"/>`).join('');
  const lines = roads.map((r) => `<polyline class="tm-road k-${attr(r.k)}" points="${r.p.map((p) => `${p[0]},${p[1]}`).join(' ')}"/>`).join('');
  return `<defs>${filter}${mask}</defs>
    <image class="tm-height" href="${base}height.webp" ${dim} filter="url(#tmr-${uid})"/>
    <image class="tm-shade" href="${base}shade.webp" ${dim}/>
    <g class="tm-vec" mask="url(#tmm-${uid})"><g class="tm-water">${vectors.rivers.map((r) => polyline(r.p, 'tm-river')).join('')}</g><g class="tm-roads">${casing}${lines}</g></g>
    <g class="tm-route"></g>`;
}

/** Số giây chấm sáng chạy hết tuyến. */
function dotSeconds(pointCount: number): number {
  return Math.max(MAP.DOT_MIN_SECONDS, pointCount * MAP.DOT_SECONDS_PER_SEG);
}

/** SVG của tuyến: mỗi đoạn là viền sáng + nét vẽ dần lần lượt; kèm chấm sáng chạy dọc tuyến khi không giảm chuyển động. */
export function buildRouteSvg(segs: readonly ArcSegment[], all: string, pointCount: number, reduced: boolean): string {
  const paths = segs.map((s) => `<path class="tm-seg-halo" d="${s.d}" pathLength="1"/><path class="tm-seg" d="${s.d}" pathLength="1" style="--d:${s.index * MAP.SEG_DELAY_S}s"/>`).join('');
  const dot = pointCount > 1 && !reduced ? `<circle class="tm-dot" r="1"><animateMotion dur="${dotSeconds(pointCount)}s" repeatCount="indefinite" path="${all}" begin="${pointCount * MAP.SEG_DELAY_S}s"/></circle>` : '';
  return paths + dot;
}
