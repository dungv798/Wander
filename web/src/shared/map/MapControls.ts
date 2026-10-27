import { COPY } from '../const/copy.vi.ts';
import { HALF } from '../const/math.const.ts';
import { MAP } from './map.const.ts';
import type { Pt } from './map.types.ts';

/** Những gì điều khiển cần từ bản đồ (nguyên lý D: điều khiển không biết gì về camera hay lớp hiển thị). */
export interface ControlsApi {
  /** Kéo bản đồ theo độ dời trên màn hình (điểm ảnh). */
  readonly panBy: (dx: number, dy: number) => void;
  /** Phóng/thu hệ số `f` quanh điểm màn hình `client` (null = tâm khung). */
  readonly zoomBy: (f: number, client: Pt | null, animate: boolean) => void;
  /** Người dùng đã tự chạm: ngừng tự vừa khung lại khi đổi cỡ. */
  readonly touched: () => void;
  /** Dừng camera đang bay (khi bắt đầu kéo). */
  readonly stopFly: () => void;
  /** Cử chỉ kết thúc: bố trí lại ghim/nhãn. */
  readonly settled: () => void;
}

const PINCH_POINTERS = 2;
const INTERACTIVE = '.tm-pin, .tm-cluster, .tm-ctl';
const ARROWS: Readonly<Record<string, Pt>> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

/** Dựng nút +/− ở góc bản đồ (có nhãn cho trình đọc màn hình). */
function buildZoomButtons(host: HTMLElement): HTMLElement {
  const ctl = Object.assign(document.createElement('div'), { className: 'tm-ctl' });
  for (const [dir, label, sign] of [['in', COPY.map.zoomIn, '+'], ['out', COPY.map.zoomOut, '−']] as const) {
    const b = Object.assign(document.createElement('button'), { type: 'button', textContent: sign });
    b.dataset['z'] = dir;
    b.setAttribute('aria-label', label);
    ctl.appendChild(b);
  }
  host.appendChild(ctl);
  return ctl;
}

/** Phím mũi tên dịch bản đồ; + và − phóng/thu (chỉ khi chính khung bản đồ đang focus). */
function onKey(e: KeyboardEvent, host: HTMLElement, api: ControlsApi): void {
  if (e.target !== host) return;
  const k = ARROWS[e.key];
  if (k) {
    e.preventDefault();
    api.touched();
    api.panBy(k[0] * MAP.PAN_STEP, k[1] * MAP.PAN_STEP);
    api.settled();
  } else if (e.key === '+' || e.key === '=') api.zoomBy(MAP.ZOOM_STEP, null, true);
  else if (e.key === '-') api.zoomBy(1 / MAP.ZOOM_STEP, null, true);
}

/** Cử chỉ con trỏ: kéo một ngón để dịch, hai ngón để chụm phóng. Trả hàm gỡ các bộ nghe. */
function attachPointers(host: HTMLElement, api: ControlsApi): () => void {
  const pointers = new Map<number, Pt>();
  let pinch: number | null = null;
  let dragging = false;
  /** Bắt đầu một ngón mới (bỏ qua khi chạm vào ghim/nút để chúng tự xử lý). */
  const down = (e: PointerEvent): void => {
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    host.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    api.touched();
    api.stopFly();
    dragging = true;
  };
  /** Di chuyển: một ngón dịch bản đồ, hai ngón phóng theo khoảng cách. */
  const move = (e: PointerEvent): void => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size !== PINCH_POINTERS) pinch = null;
    if (pointers.size === 1) api.panBy(-(e.clientX - prev[0]), -(e.clientY - prev[1]));
    else if (pointers.size === PINCH_POINTERS) {
      const [a, b] = [...pointers.values()] as [Pt, Pt];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) api.zoomBy(d / pinch, [(a[0] + b[0]) / HALF, (a[1] + b[1]) / HALF], false);
      pinch = d;
    }
  };
  /** Nhấc ngón: hết ngón nào thì kết thúc cử chỉ. */
  const up = (e: PointerEvent): void => {
    pointers.delete(e.pointerId);
    if (pointers.size) return;
    pinch = null;
    if (dragging) api.settled();
    dragging = false;
  };
  host.addEventListener('pointerdown', down);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerup', up);
  host.addEventListener('pointercancel', up);
  return () => {
    host.removeEventListener('pointerdown', down);
    host.removeEventListener('pointermove', move);
    host.removeEventListener('pointerup', up);
    host.removeEventListener('pointercancel', up);
  };
}

/**
 * Gắn điều khiển cho bản đồ tương tác: nút +/−, kéo, chụm, lăn chuột, chạm đúp, phím. Trả hàm gỡ mọi thứ đã gắn.
 * Khung bản đồ nhận focus (tabIndex 0) để dùng được bằng bàn phím.
 */
export function attachMapControls(host: HTMLElement, api: ControlsApi): () => void {
  host.tabIndex = 0;
  const ctl = buildZoomButtons(host);
  let wheelTimer = 0;
  const keydown = (e: KeyboardEvent): void => onKey(e, host, api);
  const click = (e: MouseEvent): void => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-z]');
    if (b) api.zoomBy(b.dataset['z'] === 'in' ? MAP.ZOOM_STEP : 1 / MAP.ZOOM_STEP, null, true);
  };
  const wheel = (e: WheelEvent): void => {
    e.preventDefault();
    api.zoomBy(Math.exp(-e.deltaY * MAP.WHEEL_SENS), [e.clientX, e.clientY], false);
    window.clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(api.settled, MAP.WHEEL_SETTLE_MS);
  };
  const dbl = (e: MouseEvent): void => {
    if (!(e.target as HTMLElement).closest(INTERACTIVE)) api.zoomBy(MAP.ZOOM_STEP, [e.clientX, e.clientY], true);
  };
  host.addEventListener('keydown', keydown);
  ctl.addEventListener('click', click);
  host.addEventListener('wheel', wheel, { passive: false });
  host.addEventListener('dblclick', dbl);
  const detachPointers = attachPointers(host, api);
  return () => {
    window.clearTimeout(wheelTimer);
    host.removeEventListener('keydown', keydown);
    ctl.removeEventListener('click', click);
    host.removeEventListener('wheel', wheel);
    host.removeEventListener('dblclick', dbl);
    detachPointers();
    ctl.remove();
  };
}
