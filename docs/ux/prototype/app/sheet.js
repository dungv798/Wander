/* Tờ kéo được ở đáy màn (bottom sheet) với ba nấc: thu gọn / nửa / đầy. Dùng ở màn chuyến đi để bản đồ luôn thấy được.
   Quy ước: chuẩn FE (chú thích trước mỗi hàm, hằng số ở SHEET_CONST). Chuyển động chỉ transform; giảm chuyển động thì nhảy nấc. */

/** Hằng số của tờ kéo. */
const SHEET_CONST = Object.freeze({
  PEEK_VISIBLE: 168,       // chiều cao nhìn thấy ở nấc thu gọn (đủ thấy tay nắm + tiêu đề + tab)
  HALF_RATIO: 0.5,         // nấc nửa: tỉ lệ chiều cao khung
  FULL_TOP: 72,            // nấc đầy: cách mép trên khung (chừa nút nổi trên bản đồ)
  VELOCITY_SNAP: 0.45,     // vận tốc (px/ms) đủ để nhảy sang nấc kế theo hướng vuốt
  TAP_MAX_MOVE: 6,         // di chuyển tối đa (px) vẫn tính là chạm
  OVERDRAG_DOWN: 40,       // kéo quá nấc thu gọn tối đa (px) trước khi dừng
  OVERDRAG_UP: 12          // kéo quá nấc đầy tối đa (px)
});

/** Tờ kéo theo chiều dọc có các nấc cố định. */
class BottomSheet {
  #el; #handle; #frame; #snap; #onChange; #drag = null; #grab = null; #ro = null;

  /**
   * @param {HTMLElement} el phần tử tờ (position:absolute; inset:0 trong khung)
   * @param {HTMLElement} handle vùng nắm kéo (tay nắm + tiêu đề)
   * @param {{initial?:string, onChange?:(snap:string, visiblePx:number)=>void}} opt
   */
  constructor(el, handle, opt = {}) {
    this.#el = el; this.#handle = handle; this.#frame = el.parentElement; this.#onChange = opt.onChange; this.#snap = opt.initial || 'half';
    handle.addEventListener('pointerdown', (e) => this.#down(e));
    handle.addEventListener('pointermove', (e) => this.#move(e));
    handle.addEventListener('pointerup', (e) => this.#up(e));
    handle.addEventListener('pointercancel', (e) => this.#up(e));
    this.#grab = handle.querySelector('.grab');
    this.#grab?.addEventListener('click', (e) => { if (e.detail === 0) this.step(this.#snap === 'full' ? -1 : 1); });   // Enter/Space (click do bàn phím tạo ra)
    this.#grab?.addEventListener('keydown', (e) => { if (e.key === 'ArrowUp') { e.preventDefault(); this.step(1); } else if (e.key === 'ArrowDown') { e.preventDefault(); this.step(-1); } });
    this.#ro = new ResizeObserver(() => { if (!this.#drag) this.set(this.#snap, false); }); this.#ro.observe(this.#frame);   // xoay màn hình / đổi cỡ: tính lại các nấc
    this.set(this.#snap, false);
  }

  /** Tên nấc hiện tại. */
  get snap() { return this.#snap; }

  /** Chiều cao khung chứa (px). */
  #height() { return this.#frame.getBoundingClientRect().height; }

  /** Khoảng dịch xuống (px) của từng nấc: 0 = đầy. */
  #offsets() {
    const h = this.#height(), full = SHEET_CONST.FULL_TOP, sheetH = h - full;
    return { full: 0, half: Math.max(0, Math.round(h * (1 - SHEET_CONST.HALF_RATIO)) - full), peek: Math.max(0, sheetH - SHEET_CONST.PEEK_VISIBLE) };
  }

  /** Chiều cao phần tờ đang nhìn thấy ở một nấc (để bản đồ chừa chỗ). */
  visibleFor(name) { return this.#height() - SHEET_CONST.FULL_TOP - this.#offsets()[name]; }

  /** Đặt nấc (có hoạt họa trừ khi giảm chuyển động hoặc animate=false). */
  set(name, animate = true) {
    const o = this.#offsets(); this.#snap = name in o ? name : 'half';
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#el.classList.toggle('is-anim', animate && !reduce);
    this.#el.style.setProperty('--sheet-top', SHEET_CONST.FULL_TOP + 'px');
    this.#el.style.setProperty('--sy', o[this.#snap] + 'px');
    this.#el.style.setProperty('--hide', o[this.#snap] + 'px');
    this.#el.dataset.snap = this.#snap;
    this.#grab?.setAttribute('aria-expanded', String(this.#snap !== 'peek'));
    this.#onChange?.(this.#snap, this.visibleFor(this.#snap));
  }

  /** Ngừng quan sát kích thước (gọi khi màn bị dựng lại). */
  destroy() { this.#ro?.disconnect(); }

  /** Lên/xuống một nấc (dir: +1 lên, −1 xuống). */
  step(dir) {
    const order = ['peek', 'half', 'full'], i = order.indexOf(this.#snap);
    this.set(order[Math.max(0, Math.min(2, i + dir))]);
  }

  /** Bắt đầu kéo. */
  #down(e) {
    if (e.target.closest('button:not(.grab), a, input, select, [role="tab"]')) return;
    this.#handle.setPointerCapture(e.pointerId);
    this.#drag = { y0: e.clientY, t0: performance.now(), base: parseFloat(this.#el.style.getPropertyValue('--sy')) || 0, moved: 0, last: e.clientY, tLast: performance.now(), v: 0 };
    this.#el.classList.remove('is-anim');
  }

  /** Đang kéo: dời tờ theo ngón tay (chặn quá nấc đầy và quá nấc thu gọn). */
  #move(e) {
    const d = this.#drag; if (!d) return;
    const o = this.#offsets(), dy = e.clientY - d.y0, now = performance.now();
    d.moved = Math.max(d.moved, Math.abs(dy)); d.v = (e.clientY - d.last) / Math.max(1, now - d.tLast); d.last = e.clientY; d.tLast = now;
    const y = Math.min(o.peek + SHEET_CONST.OVERDRAG_DOWN, Math.max(-SHEET_CONST.OVERDRAG_UP, d.base + dy));
    this.#el.style.setProperty('--sy', y + 'px'); this.#el.style.setProperty('--hide', Math.max(0, y) + 'px');
  }

  /** Thả tay: chạm = đổi nấc; vuốt = nấc theo vận tốc; kéo chậm = nấc gần nhất. */
  #up() {
    const d = this.#drag; if (!d) return; this.#drag = null;
    if (d.moved <= SHEET_CONST.TAP_MAX_MOVE) { this.step(this.#snap === 'full' ? -1 : 1); return; }
    const o = this.#offsets(), y = parseFloat(this.#el.style.getPropertyValue('--sy')) || 0, order = ['full', 'half', 'peek'];
    if (Math.abs(d.v) > SHEET_CONST.VELOCITY_SNAP) { const i = order.indexOf(this.#snap); this.set(order[Math.max(0, Math.min(2, i + (d.v > 0 ? 1 : -1)))]); return; }
    this.set(order.reduce((best, n) => (Math.abs(o[n] - y) < Math.abs(o[best] - y) ? n : best), 'half'));
  }
}

window.BottomSheet = BottomSheet;
