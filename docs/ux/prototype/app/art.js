/* Minh họa vector "bóng kính" của Wander (máy bay, la bàn, ghim, mặt trời). Màu lấy từ token --obj-* nên đổi bộ màu là đổi theo.
   Mỗi hàm trả về chuỗi SVG; id gradient có tiền tố riêng để dùng nhiều lần trên một trang. Chuẩn FE: chú thích trước mỗi hàm. */
const WanderArt = (() => {
  /** Dải màu nhiều điểm dừng từ danh sách [offset, tên token, độ mờ?]. */
  const stops = (list) => list.map(([o, tok, a]) => `<stop offset="${o}" style="stop-color:var(${tok})"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');

  /** Máy bay hành khách nhìn nghiêng, đuôi khói; viewBox 0 0 260 110. */
  function plane(cls = 'plane') {
    return `<svg class="${cls}" viewBox="0 0 260 110" aria-hidden="true"><defs>
      <linearGradient id="aw-body" x1="0" y1="0" x2="0" y2="1">${stops([[0, '--obj-hi'], [0.55, '--obj-mid'], [1, '--obj-lo']])}</linearGradient>
      <linearGradient id="aw-wing" x1="0" y1="0" x2="1" y2="1">${stops([[0, '--obj-hi'], [1, '--obj-lo']])}</linearGradient>
      <linearGradient id="aw-trail" x1="1" y1="0" x2="0" y2="0">${stops([[0, '--obj-hi', 0.95], [1, '--obj-hi', 0]])}</linearGradient>
      <radialGradient id="aw-eng" cx="40%" cy="35%" r="70%">${stops([[0, '--obj-hi'], [1, '--obj-accent']])}</radialGradient></defs>
      <path d="M0 68 C34 62 84 58 128 58 L128 76 C84 78 34 80 0 80Z" fill="url(#aw-trail)"/>
      <path d="M62 60 L34 22 L56 22 L106 56Z" fill="url(#aw-wing)" style="stroke:var(--obj-edge)" stroke-width="1.5"/>
      <path d="M126 62 C156 44 208 42 240 55 C254 60 254 69 240 74 C208 86 156 82 126 74Z" fill="url(#aw-body)" style="stroke:var(--obj-edge)" stroke-width="2"/>
      <path d="M150 74 L116 102 L142 102 L190 78Z" fill="url(#aw-wing)" style="stroke:var(--obj-edge)" stroke-width="1.5"/>
      <path d="M232 55 C244 55 252 60 252 66" fill="none" style="stroke:var(--obj-accent)" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M140 56 C170 49 212 48 236 57" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <g style="fill:var(--sky)" opacity=".85">${[168, 184, 200, 216].map((x) => `<ellipse cx="${x}" cy="62" rx="5" ry="4.2"/>`).join('')}</g>
      <ellipse cx="140" cy="88" rx="15" ry="8.5" fill="url(#aw-eng)" style="stroke:var(--obj-edge)" stroke-width="1.5"/></svg>`;
  }

  /** La bàn bóng kính; viewBox 0 0 100 100. */
  function compass(cls = 'compass') {
    const ticks = Array.from({ length: 12 }, (_, i) => `<line x1="50" y1="13" x2="50" y2="${i % 3 ? 17 : 21}" transform="rotate(${i * 30} 50 50)" style="stroke:var(--obj-edge)" stroke-width="${i % 3 ? 1.4 : 2.4}" stroke-linecap="round"/>`).join('');
    return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><defs>
      <linearGradient id="ac-ring" x1="0" y1="0" x2="1" y2="1">${stops([[0, '--obj-hi'], [0.5, '--obj-mid'], [1, '--obj-lo']])}</linearGradient>
      <radialGradient id="ac-dial" cx="40%" cy="30%" r="80%">${stops([[0, '--obj-hi'], [1, '--obj-mid']])}</radialGradient></defs>
      <circle cx="50" cy="50" r="46" fill="url(#ac-ring)" style="stroke:var(--obj-edge)" stroke-width="2"/>
      <circle cx="50" cy="50" r="38" fill="url(#ac-dial)"/>${ticks}
      <g class="ac-needle"><path d="M50 22 L58 50 L50 78 L42 50Z" fill="#fff" style="stroke:var(--obj-edge)" stroke-width="1"/><path d="M50 22 L58 50 L50 50Z" style="fill:var(--obj-accent)"/><path d="M50 78 L42 50 L50 50Z" style="fill:var(--ink-fixed)" opacity=".75"/></g>
      <circle cx="50" cy="50" r="4" fill="#fff" style="stroke:var(--obj-edge)" stroke-width="1.2"/>
      <path d="M20 34 A34 34 0 0 1 44 15" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/></svg>`;
  }

  /** Ghim bản đồ bóng kính; viewBox 0 0 100 110. */
  function pin(cls = 'pin3d') {
    return `<svg class="${cls}" viewBox="0 0 100 110" aria-hidden="true"><defs>
      <linearGradient id="ap-body" x1="0" y1="0" x2="1" y2="1">${stops([[0, '--cta-g1'], [1, '--cta-2']])}</linearGradient></defs>
      <ellipse cx="50" cy="102" rx="22" ry="6" fill="#000" opacity=".16"/>
      <path d="M50 4 C28 4 12 20 12 41 C12 68 50 98 50 98 C50 98 88 68 88 41 C88 20 72 4 50 4Z" fill="url(#ap-body)" stroke="#fff" stroke-width="3"/>
      <circle cx="50" cy="40" r="15" fill="#fff"/><path d="M26 28 C30 18 40 12 50 11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></svg>`;
  }

  /** Mặt trời có tia quay chậm; viewBox 0 0 120 120. */
  function sun(cls = 'sun3d') {
    const rays = Array.from({ length: 12 }, (_, i) => `<rect x="57" y="2" width="6" height="${i % 2 ? 14 : 22}" rx="3" transform="rotate(${i * 30} 60 60)"/>`).join('');
    return `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true"><defs>
      <radialGradient id="as-core" cx="38%" cy="32%" r="75%">${stops([[0, '--sun-hi'], [1, '--sun']])}</radialGradient></defs>
      <g class="as-rays" style="fill:var(--sun)" opacity=".75">${rays}</g><circle cx="60" cy="60" r="30" fill="url(#as-core)"/></svg>`;
  }

  return Object.freeze({ plane, compass, pin, sun });
})();
window.WanderArt = WanderArt;
