// Áp bộ màu nang-vang-2 vào thư viện thành phần (docs/ux/prototype/tokens.css), ánh xạ tên token thư viện <- tên token của app.
const fs = require('fs');
const root = 'D:/Wander/';
const pal = fs.readFileSync(root + 'docs/ux/palettes/nang-vang-2.css', 'utf8');
const block = (text, start) => { const open = text.indexOf('{', start); let d = 0; for (let i = open; i < text.length; i++) { if (text[i] === '{') d++; if (text[i] === '}' && --d === 0) return [open + 1, i]; } throw new Error('khối'); };
const vars = (t) => Object.fromEntries([...t.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const [a0, a1] = block(pal, pal.indexOf(':root {'));
const light = vars(pal.slice(a0, a1));
const mAt = pal.indexOf('prefers-color-scheme: dark');
const [b0, b1] = block(pal, pal.indexOf(':root', mAt));
const dark = { ...light, ...vars(pal.slice(b0, b1)) };
const MAP = { '--bg': '--bg', '--surface': '--surface', '--surface-2': '--surface-2', '--ink': '--ink', '--muted': '--muted', '--line': '--line', '--brand': '--brand', '--brand-ink': '--brand-ink', '--brand-soft': '--brand-soft',
  '--cta-1': '--cta', '--cta-2': '--cta-g2', '--cta-1-hover': '--cta-hover', '--cta-2-hover': '--cta-hover', '--on-cta': '--on-cta', '--sun': '--sun', '--sky': '--sky', '--sky-soft': '--sky-soft', '--like': '--like', '--skip': '--skip',
  '--warn-bg': '--warn-bg', '--warn-line': '--warn-line', '--warn-ink': '--warn-ink', '--glass': '--glass', '--sky-1': '--sky-1', '--sky-2': '--sky-2', '--on-day': '--on-d' };
for (let i = 1; i <= 7; i++) MAP['--day-' + i] = '--d' + i;
for (const c of ['canh', 'van', 'am', 'leo', 'luu', 'cho']) { MAP['--cat-' + c] = '--cat-' + c + '-b'; MAP['--on-cat-' + c] = '--cat-' + c + '-on'; MAP['--cat-' + c + '-tint'] = '--cat-' + c + '-t'; MAP['--cat-' + c + '-ink'] = '--cat-' + c + '-i'; }
const f = root + 'docs/ux/prototype/tokens.css';
let css = fs.readFileSync(f, 'utf8');
const iMedia = css.indexOf('@media (prefers-color-scheme: dark)');
const iAttr = css.indexOf(':root[data-theme="dark"]');
if (iMedia < 0 || iAttr < 0) throw new Error('không thấy khối tối');
const apply = (text, values) => { let n = 0; for (const [lib, pn] of Object.entries(MAP)) { if (!(pn in values)) continue; const re = new RegExp('(' + lib.replace(/[-]/g, '\\-') + '\\s*:\\s*)([^;]+)(;)'); if (re.test(text)) { text = text.replace(re, (m, p1, p2, p3) => p1 + values[pn] + p3); n++; } } return [text, n]; };
let [lt, nl] = apply(css.slice(0, iMedia), light);
let [dm, nm] = apply(css.slice(iMedia, iAttr), dark);
let [da, na] = apply(css.slice(iAttr), dark);
fs.writeFileSync(f, lt + dm + da);
console.log('đã thay', nl, 'token sáng,', nm, 'token tối (media),', na, 'token tối (thuộc tính)');
