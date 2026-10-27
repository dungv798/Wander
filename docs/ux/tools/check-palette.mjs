// Kiểm tương phản của một bộ màu thử (docs/ux/palettes/<tên>.css) bằng cách ghép nó vào tokens.css rồi chạy contrast.mjs.
//   node docs/ux/tools/check-palette.mjs bien-som
// Ghi đè được áp vào khối :root đầu tiên (bản sáng); khối tối giữ nguyên (tối làm sau, PO 26/10/2026).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../../..');
const name = process.argv[2];
if (!name) { console.error('Dùng: node docs/ux/tools/check-palette.mjs <tên bộ màu>'); process.exit(2); }
const tokens = fs.readFileSync(path.join(ROOT, 'docs/ux/prototype/tokens.css'), 'utf8');
const pal = fs.readFileSync(path.join(ROOT, 'docs/ux/palettes', name + '.css'), 'utf8');
const open = tokens.indexOf(':root {'), start = tokens.indexOf('{', open);
let depth = 0, end = start;
for (let i = start; i < tokens.length; i++) { if (tokens[i] === '{') depth++; if (tokens[i] === '}' && --depth === 0) { end = i; break; } }
let block = tokens.slice(start + 1, end);
for (const m of pal.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  const re = new RegExp('(' + m[1] + '\\s*:\\s*)[^;]+;');
  block = re.test(block) ? block.replace(re, (_, p) => p + m[2].trim() + ';') : block + `\n  ${m[1]}: ${m[2].trim()};`;
}
const merged = tokens.slice(0, start + 1) + block + tokens.slice(end);
const out = path.join(ROOT, '.tmp/palette-check');
fs.mkdirSync(out, { recursive: true });
const file = path.join(out, name + '.css');
fs.writeFileSync(file, merged);
let bad = 0;
for (const pairs of ['docs/ux/tools/contrast-pairs.json', 'docs/ux/tools/contrast-pairs-app.json']) {
  const r = spawnSync(process.execPath, [path.join(here, 'contrast.mjs'), `--css=${path.relative(ROOT, file)}`, `--pairs=${pairs}`], { cwd: ROOT, encoding: 'utf8' });
  const lines = r.stdout.split('\n');
  const fails = lines.filter((l) => l.startsWith('✖'));
  console.log(`${pairs.split('/').pop()}: ${lines.filter((l) => /phép tính/.test(l)).join('').trim()}`);
  fails.slice(0, 40).forEach((l) => console.log('  ' + l));
  if (r.status !== 0) bad++;
}
process.exit(bad ? 1 : 0);
