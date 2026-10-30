import fs from 'node:fs';
import assert from 'node:assert/strict';

const css = fs.readFileSync('web/src/styles/tokens.css', 'utf8');
/** Đọc trực tiếp màu token để phép đo không bị lệch khi đổi bộ màu. */
const hex = name => css.match(new RegExp(`--${name}: (#\\w{6})`))[1].slice(1).match(/../g).map(x => parseInt(x, 16));
/** Tính độ chói tương đối theo sRGB. */
const lum = rgb => rgb.reduce((s, c, i) => { const v = c / 255; return s + (v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4) * [.2126, .7152, .0722][i]; }, 0);
/** Tỷ số WCAG của hai màu đã ghép alpha. */
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
const alpha = Number(css.match(/--control-surface: rgb\(255 255 255 \/ ([\d.]+)\)/)[1]);
const selection = Number(css.match(/--control-selected: linear-gradient\(rgb\(255 196 0 \/ ([\d.]+)\)/)[1]);
const backgrounds = [[0, 0, 0], [255, 255, 255], [143, 211, 251]];
const rows = backgrounds.map(bg => {
  const surface = bg.map(c => 255 * alpha + c * (1 - alpha));
  const selected = surface.map((c, i) => c * (1 - selection) + [255, 196, 0][i] * selection);
  return { background: bg, edge: ratio(hex('control-edge'), surface), selectedEdge: ratio(hex('control-accent'), selected) };
});
fs.writeFileSync('.logs/ux-buttons/border-contrast.json', JSON.stringify(rows, null, 2));
assert.ok(rows.every(x => x.edge >= 3 && x.selectedEdge >= 3));
console.log(`PASS: viền chung/chọn trên trắng, đen, xanh bản đồ; thấp nhất ${Math.min(...rows.flatMap(x => [x.edge, x.selectedEdge])).toFixed(2)}:1`);
