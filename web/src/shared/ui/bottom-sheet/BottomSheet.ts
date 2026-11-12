import { MEDIA } from '../../const/app.const.ts';
import { SHEET, SHEET_HINT, SNAP_ORDER } from './bottomSheet.const.ts';
import type { Snap } from './bottomSheet.const.ts';
import { dismissSheetHint, rememberedSnap, rememberSnap, sheetMemoryKey, shouldShowSheetHint } from './sheetMemory.ts';

/** The draggable-sheet options. */
export interface BottomSheetOptions {
  readonly initial: Snap;
  /** Called when the step changes, with the height of the part of the sheet that is visible (so the map leaves room). */
  readonly onChange: (snap: Snap, visiblePx: number) => void;
}

/** The state of one drag. */
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

/** A vertical draggable sheet with fixed steps (collapsed / half / full); it only uses `transform` through CSS variables; with reduced motion it jumps between steps. */
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

  /** Attaches the sheet to the element `el` (inside the frame `el.parentElement`) with the drag handle area `handle`. */
  constructor(el: HTMLElement, handle: HTMLElement, opt: BottomSheetOptions) {
    this.el = el;
    this.handle = handle;
    this.frame = el.parentElement as HTMLElement;
    this.opt = opt;
    this.snapName = rememberedSnap(this.memoryKey, opt.initial);
    this.grab = handle.querySelector<HTMLElement>('.grab');
    this.hint.className = SHEET_HINT.CLASS;
    this.hint.textContent = SHEET_HINT.TEXT;
    try { this.hint.hidden = !shouldShowSheetHint(); } catch { this.hint.hidden = false; }
    handle.append(this.hint);
    const sig = { signal: this.abort.signal };
    handle.addEventListener('pointerdown', (e) => this.down(e), sig);
    handle.addEventListener('pointermove', (e) => this.move(e), sig);
    handle.addEventListener('pointerup', () => this.up(), sig);
    handle.addEventListener('pointercancel', () => this.up(), sig);
    // Enter/Space on the handle button creates a `click` with detail = 0; the up/down arrows change the step
    this.grab?.addEventListener('click', (e) => (e.detail === 0 ? this.step(this.snapName === 'full' ? -1 : 1) : undefined), sig);
    this.grab?.addEventListener('keydown', (e) => this.onKey(e), sig);
    this.observer = new ResizeObserver(() => (this.drag ? undefined : this.set(this.snapName, false)));
    this.observer.observe(this.frame);
    this.set(this.snapName, false);
  }

  /** The current step. */
  get snap(): Snap {
    return this.snapName;
  }

  /** The arrow keys on the handle button: up expands, down collapses. */
  private onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') this.step(1);
    else if (e.key === 'ArrowDown') this.step(-1);
    else return;
    e.preventDefault();
  }

  /** The height of the containing frame. */
  private height(): number {
    return this.frame.getBoundingClientRect().height;
  }

  /** The downward offset (px) of each step; 0 is the full step. */
  private offsets(): Record<Snap, number> {
    const h = this.height();
    const sheetH = h - SHEET.FULL_TOP;
    return { full: 0, half: Math.max(0, Math.round(h * (1 - SHEET.HALF_RATIO)) - SHEET.FULL_TOP), peek: Math.max(0, sheetH - SHEET.PEEK_VISIBLE) };
  }

  /** The height of the visible part of the sheet at one step. */
  visibleFor(name: Snap): number {
    return this.height() - SHEET.FULL_TOP - this.offsets()[name];
  }

  /** Sets the step (with animation unless reduced motion or `animate = false`) and notifies the listeners. */
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

  /** Removes the listeners and stops observing the size (when the screen is removed). */
  destroy(): void {
    this.abort.abort();
    this.observer.disconnect();
    this.hint.remove();
  }

  /** Up (+1) or down (-1) one step. */
  step(dir: 1 | -1): void {
    const i = SNAP_ORDER.indexOf(this.snapName);
    this.set(SNAP_ORDER[Math.max(0, Math.min(SNAP_ORDER.length - 1, i + dir))] as Snap);
  }

  /** Starts a drag (ignored when tapping a button/link/input inside the handle area, except the handle button). */
  private down(e: PointerEvent): void {
    if ((e.target as HTMLElement).closest('button:not(.grab), a, input, select, [role="tab"]')) return;
    this.handle.setPointerCapture(e.pointerId);
    this.drag = { y0: e.clientY, base: Number.parseFloat(this.el.style.getPropertyValue(OFFSET_VAR)) || 0, moved: 0, last: e.clientY, tLast: performance.now(), v: 0 };
    this.el.classList.remove('is-anim');
  }

  /** While dragging: moves the sheet with the finger, clamped at the full step and the collapsed step. */
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

  /** Release: a tap = change step; a fast swipe = the next step in the direction; a slow drag = the nearest step. */
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
    try { dismissSheetHint(); } catch { /* Storage is blocked: the invitation is still hidden this time. */ }
    const order: readonly Snap[] = ['full', 'half', 'peek'];
    if (Math.abs(d.v) > SHEET.VELOCITY_SNAP) {
      const i = order.indexOf(this.snapName);
      this.set(order[Math.max(0, Math.min(order.length - 1, i + (d.v > 0 ? 1 : -1)))] as Snap);
      return;
    }
    this.set(order.reduce((best, n) => (Math.abs(o[n] - y) < Math.abs(o[best] - y) ? n : best), 'half' as Snap));
  }
}
