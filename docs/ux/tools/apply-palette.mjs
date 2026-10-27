// Áp một bộ màu (docs/ux/palettes/<id>.css) vào app.css: thay khối token (từ ":root {" đầu tiên tới trước "* { box-sizing") bằng phần token của bộ màu,
// còn quy tắc nút gradient (phần sau dòng "/* Nút chính") được nối vào cuối adaptive.css (nếu chưa có).
//   node docs/ux/tools/apply-palette.mjs nang-vang-2
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './serve.mjs';

const id = process.argv[2];
if (!id) { console.error('Thiếu mã bộ màu'); process.exit(2); }
const pal = fs.readFileSync(path.join(ROOT, 'docs/ux/palettes', id + '.css'), 'utf8');
const cut = pal.indexOf('\n/* Nút chính');
const tokens = (cut < 0 ? pal : pal.slice(0, cut)).replace(/^\/\*[\s\S]*?\*\/\s*/, '').trimEnd();
const gradient = cut < 0 ? '' : pal.slice(cut).trim();

const appPath = path.join(ROOT, 'docs/ux/prototype/app/app.css');
let app = fs.readFileSync(appPath, 'utf8');
const start = app.indexOf(':root {');
const end = app.indexOf('* { box-sizing');
if (start < 0 || end < 0 || end < start) throw new Error('Không thấy khối token trong app.css');
app = app.slice(0, start) + tokens + '\n\n' + app.slice(end);
fs.writeFileSync(appPath, app);

const adPath = path.join(ROOT, 'docs/ux/prototype/app/adaptive.css');
let ad = fs.readFileSync(adPath, 'utf8');
if (gradient && !ad.includes('/* Nút chính: gradient')) fs.writeFileSync(adPath, ad.trimEnd() + '\n\n' + gradient + '\n');
console.log(`Đã áp "${id}" vào app.css (${tokens.split('\n').length} dòng token)${gradient ? ' và quy tắc nút gradient vào adaptive.css' : ''}.`);
