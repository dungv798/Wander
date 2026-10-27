// Tính tỉ lệ tương phản WCAG từ token trong docs/ux/prototype/tokens.css theo docs/ux/tools/contrast-pairs.json.
//   node docs/ux/tools/contrast.mjs
// Hỗ trợ: màu hex; màu rgba được trộn lên nền xấu nhất `over` (ví dụ ảnh trắng) trước khi tính; kiểm khối tối `@media` và
// `[data-theme="dark"]` giống hệt nhau (nếu lệch, thoát mã 1). Thoát mã 1 nếu có cặp dưới ngưỡng.
// GIỚI HẠN (không tự kiểm): trạng thái disabled (miễn trừ theo WCAG), chữ trên ảnh thật (chỉ tính trường hợp xấu nhất qua scrim),
// vòng focus trên mọi nền ảnh. Những thứ này xem bằng ảnh chụp.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.mjs';

const arg = (k, d) => (process.argv.find((x) => x.startsWith('--' + k + '=')) ?? '').split('=')[1] || d;
// Mặc định kiểm tokens.css (thư viện thành phần). App v4: --css=docs/ux/prototype/app/app.css --pairs=docs/ux/tools/contrast-pairs-app.json
const css = fs.readFileSync(path.join(ROOT, arg('css', 'docs/ux/prototype/tokens.css')), 'utf8');
const pairs = JSON.parse(fs.readFileSync(path.join(ROOT, arg('pairs', 'docs/ux/tools/contrast-pairs.json')), 'utf8'));

/** Lấy nội dung khối { ... } đầu tiên sau vị trí start (đếm ngoặc). */
function block(start) {
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return '';
}
const vars = (text) => Object.fromEntries([...text.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const light = vars(block(css.indexOf(':root {')));
const mediaAt = css.indexOf('prefers-color-scheme: dark');
const darkMedia = vars(block(css.indexOf(':root', mediaAt)));
const darkAttr = vars(block(css.indexOf(':root[data-theme="dark"]')));
const dark = { ...light, ...darkMedia };
/** Giải tham chiếu var(--x) thành giá trị thật (ví dụ --focus: var(--sky)). */
for (const set of [light, dark]) for (let pass = 0; pass < 6; pass++) for (const k of Object.keys(set)) { const m = /^var\((--[a-z0-9-]+)\)$/.exec(set[k]); if (m && set[m[1]]) set[k] = set[m[1]]; }

let bad = 0;
const keysDiff = [...new Set([...Object.keys(darkMedia), ...Object.keys(darkAttr)])].filter((k) => darkMedia[k] !== darkAttr[k]);
if (keysDiff.length) {
  bad++;
  console.log(`✖  Khối tối @media và [data-theme="dark"] KHÁC nhau ở: ${keysDiff.join(', ')}`);
} else {
  console.log(`✔  Khối tối @media và [data-theme="dark"] giống hệt nhau (${Object.keys(darkMedia).length} token)`);
}

function parse(v) {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v ?? '')) {
    const h = v.replace('#', '');
    const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return { rgb: [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)), a: 1 };
  }
  const m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?\s*\)$/.exec(v ?? '');
  return m ? { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], a: m[4] === undefined ? 1 : Number(m[4]) } : null;
}
const over = (c, base) => c.rgb.map((v, i) => Math.round(c.a * v + (1 - c.a) * base.rgb[i]));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

let skipped = 0;
let total = 0;
for (const [name, set] of [['sáng', light], ['tối', dark]]) {
  console.log(`\nGiao diện ${name}`);
  for (const p of pairs) {
    const fg = parse(set[p.fg]);
    let bg = parse(set[p.bg]);
    if (!fg || !bg) {
      skipped++;
      console.log(`  ?  ${p.fg} trên ${p.bg}: bỏ qua (token không đọc được: ${set[p.fg]} / ${set[p.bg]})`);
      continue;
    }
    // nền rgba: trộn lên nền xấu nhất; chữ rgba: trộn lên nền đã tính
    const baseRgb = bg.a < 1 ? { rgb: (parse(p.over ?? '#ffffff')).rgb, a: 1 } : null;
    const bgRgb = baseRgb ? over(bg, baseRgb) : bg.rgb;
    const fgRgb = fg.a < 1 ? over(fg, { rgb: bgRgb, a: 1 }) : fg.rgb;
    const r = ratio(fgRgb, bgRgb);
    const ok = r >= p.min;
    total++;
    if (!ok) bad++;
    console.log(`  ${ok ? '✔' : '✖'}  ${r.toFixed(2)}:1 (cần ≥ ${p.min})  ${p.fg} trên ${p.bg}${bg.a < 1 ? ` (rgba trên ${p.over ?? '#ffffff'})` : ''}  — ${p.note}`);
  }
}
console.log(`\n${total} phép tính (${pairs.length} cặp × sáng/tối), ${bad} lỗi, ${skipped} bỏ qua.`);
process.exit(bad ? 1 : 0);
