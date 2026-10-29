import { MEDIA } from '../../const/app.const.ts';
import { SHEET, SHEET_HINT, SNAP_ORDER } from './bottomSheet.const.ts';
import type { Snap } from './bottomSheet.const.ts';
import { dismissSheetHint, rememberedSnap, rememberSnap, sheetMemoryKey, shouldShowSheetHint } from './sheetMemory.ts';

/** Tùy chọn tờ kéo. */
export interface BottomSheetOptions {
  readonly initial: Snap;
  /** Gọi khi đổi nấc, kèm chiều cao phần tờ đang nhìn thấy (để bản đồ chừa chỗ). */
  readonly onChange: (snap: Snap, visiblePx: number) => void;
}

/** Trạng thái một lần kéo. */
interface Drag {
  readonly y0: number;
  readonly base: number;
  moved: number;
  last: number;
  tLast: number;
  v: number;
}

const OFFSET_VAR = '--sy';
const HIDE_VAR = '--hide';

/** Tờ kéo theo chiều dọc có các nấc cố định (thu gọn / nửa / đầy); chỉ dùng `transform` qua biến CSS; giảm chuyển động thì nhảy nấc. */
export class BottomSheet {
  private snapName: Snap;
  private drag: Drag | null = null;
  private readonly el: HTMLElement;
  private readonly handle: HTMLElement;
  private readonly frame: HTMLElement;
  private readonly grab: HTMLElement | null;
  private readonly observer: ResizeObserver;
  private readonly opt: BottomSheetOptions;
  private readonly abort = new AbortController();
  private readonly memoryKey = sheetMemoryKey(location.hash);
  private readonly hint = document.createElement('span');

  /** Gắn tờ vào phần tử `el` (trong khung `el.parentElement`) với vùng nắm kéo `handle`. */
  constructor(el: HTMLElement, handle: HTMLElement, opt: BottomSheetOptions) {
    this.el = el;
    this.handle = handle;
    this.frame = el.parentElement as HTMLElement;
    this.opt = opt;
    this.snapName = rememberedSnap(this.memoryKey, opt.initial);
    this.grab = handle.querySelector<HTMLElement>('.grab');
    this.hint.className = SHEET_HINT.CLASS;
    this.hint.textContent = SHEET_HINT.TEXT;
    try { this.hint.hidden = !shouldShowSheetHint(localStorage); } catch { this.hint.hidden = false; }
    handle.append(this.hint);
    const sig = { signal: this.abort.signal };
    handle.addEventListener('pointerdown', (e) => this.down(e), sig);
    handle.addEventListener('pointermove', (e) => this.move(e), sig);
    handle.addEventListener('pointerup', () => this.up(), sig);
    handle.addEventListener('pointercancel', () => this.up(), sig);
    // Enter/Space trên nút nắm tạo `click` có detail = 0; mũi tên lên/xuống đổi nấc
    this.grab?.addEventListener('click', (e) => (e.detail === 0 ? this.step(this.snapName === 'full' ? -1 : 1) : undefined), sig);
    this.grab?.addEventListener('keydown', (e) => this.onKey(e), sig);
    this.observer = new ResizeObserver(() => (this.drag ? undefined : this.set(this.snapName, false)));
    this.observer.observe(this.frame);
    this.set(this.snapName, false);
  }

  /** Nấc hiện tại. */
  get snap(): Snap {
    return this.snapName;
  }

  /** Phím mũi tên trên nút nắm: lên mở rộng, xuống thu gọn. */
  private onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') this.step(1);
    else if (e.key === 'ArrowDown') this.step(-1);
    else return;
    e.preventDefault();
  }

  /** Chiều cao khung chứa. */
  private height(): number {
    return this.frame.getBoundingClientRect().height;
  }

  /** Khoảng dịch xuống (px) của từng nấc; 0 là nấc đầy. */
  private offsets(): Record<Snap, number> {
    const h = this.height();
    const sheetH = h - SHEET.FULL_TOP;
    return { full: 0, half: Math.max(0, Math.round(h * (1 - SHEET.HALF_RATIO)) - SHEET.FULL_TOP), peek: Math.max(0, sheetH - SHEET.PEEK_VISIBLE) };
  }

  /** Chiều cao phần tờ nhìn thấy ở một nấc. */
  visibleFor(name: Snap): number {
    return this.height() - SHEET.FULL_TOP - this.offsets()[name];
  }

  /** Đặt nấc (có hoạt họa trừ khi giảm chuyển động hoặc `animate = false`) và báo cho người nghe. */
  set(name: Snap, animate = true): void {
    const o = this.offsets();
    this.snapName = name in o ? name : 'half';
    rememberSnap(this.memoryKey, this.snapName);
    this.el.classList.toggle('is-anim', animate && !window.matchMedia(MEDIA.REDUCED_MOTION).matches);
    this.el.style.setProperty('--sheet-top', `${SHEET.FULL_TOP}px`);
    this.el.style.setProperty(OFFSET_VAR, `${o[this.snapName]}px`);
    this.el.style.setProperty(HIDE_VAR, `${o[this.snapName]}px`);
    this.el.dataset['snap'] = this.snapName;
    this.grab?.setAttribute('aria-expanded', String(this.snapName !== 'peek'));
    this.opt.onChange(this.snapName, this.visibleFor(this.snapName));
  }

  /** Gỡ bộ nghe và ngừng quan sát kích thước (khi màn bị gỡ). */
  destroy(): void {
    this.abort.abort();
    this.observer.disconnect();
    this.hint.remove();
  }

  /** Lên (+1) hoặc xuống (−1) một nấc. */
  step(dir: 1 | -1): void {
    const i = SNAP_ORDER.indexOf(this.snapName);
    this.set(SNAP_ORDER[Math.max(0, Math.min(SNAP_ORDER.length - 1, i + dir))] as Snap);
  }

  /** Bắt đầu kéo (bỏ qua khi bấm nút/liên kết/ô nhập trong vùng nắm, trừ nút nắm). */
  private down(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('button:not(.grab), a, input, select, [role="tab"]')) return;
    this.handle.setPointerCapture(e.pointerId);
    this.drag = { y0: e.clientY, base: Number.parseFloat(this.el.style.getPropertyValue(OFFSET_VAR)) || 0, moved: 0, last: e.clientY, tLast: performance.now(), v: 0 };
    this.el.classList.remove('is-anim');
  }

  /** Đang kéo: dời tờ theo ngón tay, chặn quá nấc đầy và quá nấc thu gọn. */
  private move(e: PointerEvent): void {
    const d = this.drag;
    if (!d) return;
    const o = this.offsets();
    const dy = e.clientY - d.y0;
    const now = performance.now();
    d.moved = Math.max(d.moved, Math.abs(dy));
    d.v = (e.clientY - d.last) / Math.max(1, now - d.tLast);
    d.last = e.clientY;
    d.tLast = now;
    const y = Math.min(o.peek + SHEET.OVERDRAG_DOWN, Math.max(-SHEET.OVERDRAG_UP, d.base + dy));
    this.el.style.setProperty(OFFSET_VAR, `${y}px`);
    this.el.style.setProperty(HIDE_VAR, `${Math.max(0, y)}px`);
  }

  /** Thả tay: chạm = đổi nấc; vuốt nhanh = nấc kế theo hướng; kéo chậm = nấc gần nhất. */
  private up(): void {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.moved <= SHEET.TAP_MAX_MOVE) {
      this.step(this.snapName === 'full' ? -1 : 1);
      return;
    }
    const o = this.offsets();
    const y = Number.parseFloat(this.el.style.getPropertyValue(OFFSET_VAR)) || 0;
    this.hint.hidden = true;
    try { dismissSheetHint(localStorage); } catch { /* Storage bị chặn: vẫn ẩn lời mời trong lần này. */ }
    const order: readonly Snap[] = ['full', 'half', 'peek'];
    if (Math.abs(d.v) > SHEET.VELOCITY_SNAP) {
      const i = order.indexOf(this.snapName);
      this.set(order[Math.max(0, Math.min(order.length - 1, i + (d.v > 0 ? 1 : -1)))] as Snap);
      return;
    }
    this.set(order.reduce((best, n) => (Math.abs(o[n] - y) < Math.abs(o[best] - y) ? n : best), 'half' as Snap));
  }
}
