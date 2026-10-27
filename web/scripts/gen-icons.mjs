// Sinh src/shared/ui/icons/iconPaths.const.ts từ bộ biểu tượng của prototype đã duyệt (sprite trong docs/ux/prototype/index.html).
// Chạy: node scripts/gen-icons.mjs   (chỉ cần khi prototype thêm biểu tượng; đầu ra được commit, không sinh lúc build).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, '../../docs/ux/prototype/index.html');
const TARGET = path.resolve(here, '../src/shared/ui/icons/iconPaths.const.ts');

const html = fs.readFileSync(SOURCE, 'utf8');
const icons = new Map();
for (const m of html.matchAll(/<symbol id="i-([a-z0-9-]+)"[^>]*>([\s\S]*?)<\/symbol>/g)) {
  icons.set(m[1], m[2].replace(/\s+/g, ' ').trim());
}
const names = [...icons.keys()].sort();

let out = '/** Đường vẽ biểu tượng Tabler Icons (MIT), lưới 24 px, nét 2. TẠO TỰ ĐỘNG bởi scripts/gen-icons.mjs từ sprite của prototype; không sửa tay. */\n';
out += 'export const ICON_PATHS = {\n';
for (const n of names) out += `  ${JSON.stringify(n)}: ${JSON.stringify(icons.get(n))},\n`;
out += '} as const;\n\n/** Tên biểu tượng hợp lệ (gõ sai bị chặn lúc biên dịch). */\nexport type IconName = keyof typeof ICON_PATHS;\n';
fs.writeFileSync(TARGET, out);
console.log(`${names.length} biểu tượng -> ${path.relative(process.cwd(), TARGET)}`);
