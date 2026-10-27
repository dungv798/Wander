/* Bộ chuyển động dùng chung của prototype: pháo giấy khi tạo chuyến, đếm số khi hiện. Tôn trọng prefers-reduced-motion (không chạy).
   Màu lấy từ token nên theo bộ màu đang dùng. Chuẩn FE: chú thích trước mỗi hàm, hằng số ở MOTION_CONST. */

/** Hằng số chuyển động. */
const MOTION_CONST = Object.freeze({
  CONFETTI_COUNT: 110,        // số mảnh pháo giấy
  CONFETTI_MS: 1700,          // thời lượng pháo giấy
  CONFETTI_GRAVITY: 0.0016,   // gia tốc rơi (px/ms²)
  CONFETTI_TOKENS: ['--cta-g1', '--cta-2', '--sun', '--sky', '--like', '--white'],
  COUNT_MS: 900               // thời lượng đếm số
});

const Motion = (() => {
  /** Người dùng có yêu cầu giảm chuyển động không. */
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Bắn pháo giấy từ giữa phía trên màn hình; tự dọn canvas khi xong. */
  function confetti() {
    if (reduced()) return;
    const cs = getComputedStyle(document.documentElement);
    const colors = MOTION_CONST.CONFETTI_TOKENS.map((t) => cs.getPropertyValue(t).trim()).filter(Boolean);
    const cv = Object.assign(document.createElement('canvas'), { width: innerWidth, height: innerHeight });
    Object.assign(cv.style, { position: 'fixed', inset: '0', zIndex: '70', pointerEvents: 'none' });
    cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
    const g = cv.getContext('2d');
    const parts = Array.from({ length: MOTION_CONST.CONFETTI_COUNT }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.32, vx: (Math.random() - 0.5) * 0.9, vy: -0.35 - Math.random() * 0.75,
      w: 6 + Math.random() * 6, h: 3 + Math.random() * 5, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.02, c: colors[Math.floor(Math.random() * colors.length)] || '#ff8a00'
    }));
    const t0 = performance.now(); let prev = t0;
    const step = (now) => {
      const t = now - t0, dt = Math.min(48, now - prev); prev = now;   // theo thời gian thật (màn 60/120 Hz như nhau), chặn khi tab bị treo
      g.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => {
        p.vy += MOTION_CONST.CONFETTI_GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        g.save(); g.globalAlpha = Math.max(0, 1 - t / MOTION_CONST.CONFETTI_MS); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      });
      if (t < MOTION_CONST.CONFETTI_MS) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  }

  /** Đếm các phần tử [data-count] trong một vùng từ 0 tới giá trị đích (chỉ một lần mỗi phần tử). */
  function countUp(root) {
    root.querySelectorAll('[data-count]:not([data-counted])').forEach((el) => {
      el.dataset.counted = '1';
      const to = Number(el.dataset.count), suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
      if (!Number.isFinite(to) || reduced()) { el.textContent = Number.isFinite(to) ? prefix + to + suffix : el.textContent; return; }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / MOTION_CONST.COUNT_MS), e = 1 - Math.pow(1 - k, 3);
        el.textContent = prefix + Math.round(to * e) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  return Object.freeze({ confetti, countUp, reduced });
})();
window.Motion = Motion;
