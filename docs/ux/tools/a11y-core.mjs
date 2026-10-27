// Hàm quét truy cập chạy TRONG trang (page.evaluate), dùng chung cho prototype (a11y-scan.mjs) và giao diện web/ (web/e2e). Không dùng biến ngoài hàm.
/** Chạy trong trang: trả về các lỗi tìm được. */
export function scan() {
  const issues = { contrast: [], target: [], name: [], img: [], dup: [], h1: null, label: [], skipped: 0 };
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[, /]+/).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const mix = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const label = (el) => (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || el.tagName.toLowerCase();
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const overlays = [...document.querySelectorAll('.sheet:not([hidden]) .panel')];
  const behindModal = (el) => overlays.length && !overlays[0].contains(el) && !document.querySelector('.sheet.drawer');   // nền bị phủ sau hộp thoại
  function backdrop(el) {
    const layers = []; let n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== 'none') return null;           // ảnh/gradient: không đo được
      if ([...n.children].some((c) => c.tagName === 'IMG' && getComputedStyle(c).position === 'absolute')) return null;   // có ảnh nền phía sau chữ (bìa, thẻ ảnh)
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
      n = n.parentElement;
    }
    let base = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
    if (base.a < 1) base = mix(base, { r: 255, g: 255, b: 255, a: 1 });
    layers.reverse().forEach((l) => { base = mix(l, base); });
    return base;
  }
  function opacityOf(el) { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); return o; }

  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    if (!visible(el) || el.closest('svg') || el.closest('.sr') || el.closest('[aria-hidden="true"]') || behindModal(el) || opacityOf(el) < 0.05) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent.trim()).join(' ');
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (el.closest('[disabled], [aria-disabled="true"]')) continue;            // điều khiển không hoạt động được miễn trừ (WCAG 1.4.3)
    const bg = backdrop(el);
    if (!bg) { issues.skipped++; continue; }
    const fg0 = parse(cs.color); if (!fg0) continue;
    const fg = mix({ ...fg0, a: fg0.a * opacityOf(el) }, bg);
    const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700, large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5, r = ratio(fg, bg), key = label(el) + '|' + own.slice(0, 20);
    if (r < need && !seen.has(key)) { seen.add(key); issues.contrast.push(`${label(el)} “${own.slice(0, 28)}” ${r.toFixed(2)} < ${need}`); }
  }
  for (const el of document.querySelectorAll('button, a[href], input:not([type=hidden]), select, textarea, [role=tab], [role=switch]')) {
    if (!visible(el) || behindModal(el) || el.closest('[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect(), box = el.matches('input[type=checkbox], input[type=radio]') ? (el.closest('label') || el).getBoundingClientRect() : r;
    const inline = el.tagName === 'A' && el.closest('p, li, span.note, .credits, summary, .body');
    if ((box.width < 43.5 || box.height < 43.5) && !inline && !el.closest('.cat-badge') && !el.matches('.credit-btn')) issues.target.push(`${label(el)} ${Math.round(box.width)}×${Math.round(box.height)}`);
    const nm = (el.getAttribute('aria-label') || '').trim() || (el.getAttribute('aria-labelledby') || '').split(/\s+/).map((i) => (document.getElementById(i)?.textContent ?? '').trim()).join('').trim() || (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' ? (el.labels && el.labels.length ? 'label' : '') : (el.textContent || '').trim()) || (el.getAttribute('title') || '').trim();
    if (!nm) issues.name.push(label(el));
    if ((el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') && !(el.labels && el.labels.length) && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) issues.label.push(label(el));
  }
  for (const img of document.querySelectorAll('img')) if (!img.hasAttribute('alt')) issues.img.push(img.src.slice(-40));
  const ids = {}; document.querySelectorAll('[id]').forEach((e) => { ids[e.id] = (ids[e.id] || 0) + 1; });
  Object.entries(ids).forEach(([k, v]) => { if (v > 1) issues.dup.push(k + '×' + v); });
  issues.h1 = [...document.querySelectorAll('h1')].filter(visible).length;
  return issues;
}
