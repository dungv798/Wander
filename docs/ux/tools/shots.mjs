// Chụp ảnh thật của prototype: mỗi màn × cỡ × giao diện sáng/tối. Danh sách màn: docs/ux/tools/screens.json.
//   node docs/ux/tools/shots.mjs [--only=id,id] [--sizes=390,768,1280] [--schemes=light,dark]
// Ảnh: docs/ux/screenshots/<id>--<rộng>-<sáng|tối>.png; INDEX.md ghi mã băm prototype lúc chụp để biết ảnh có cũ không.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright-core';
import { ROOT, startServer } from './serve.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1];
const only = arg('only', '').split(',').filter(Boolean);
const sizes = arg('sizes', '390,768,1280').split(',').map(Number);
const schemes = arg('schemes', 'light,dark').split(',');
const VIEW = { 390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 768: { width: 768, height: 1024, deviceScaleFactor: 1 }, 1280: { width: 1280, height: 800, deviceScaleFactor: 1 } };
const OUT = path.join(ROOT, 'docs/ux/screenshots');
const PROTO = path.join(ROOT, 'docs/ux/prototype');

function protoHash() {
  const h = crypto.createHash('sha1');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : h.update(fs.readFileSync(path.join(d, e.name)))));
  if (fs.existsSync(PROTO)) walk(PROTO);
  return h.digest('hex').slice(0, 12);
}

const screens = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/ux/tools/screens.json'), 'utf8')).filter((s) => only.length === 0 || only.includes(s.id));
fs.mkdirSync(OUT, { recursive: true });
const { url, close } = await startServer(0);
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const rows = [];
let failures = 0;
try {
  for (const scheme of schemes) {
    for (const size of sizes) {
      const ctx = await browser.newContext({ viewport: { width: VIEW[size].width, height: VIEW[size].height }, deviceScaleFactor: VIEW[size].deviceScaleFactor, isMobile: !!VIEW[size].isMobile, hasTouch: !!VIEW[size].hasTouch, colorScheme: scheme, locale: 'vi-VN', reducedMotion: 'reduce' });
      await ctx.addInitScript(() => { window.__WANDER_THEME = 'system'; window.__WANDER_NO_VT = true; });   // app mặc định sáng; ở đây mô phỏng hệ thống sáng/tối
      for (const s of screens) {
        const page = await ctx.newPage();
        // mỗi màn bắt đầu từ trạng thái sạch (app lưu màn hiện tại trong localStorage; trang trước sẽ làm lệch trang sau)
        await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* bỏ qua */ } });
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => m.type() === 'error' && !(s.blockImages && /Failed to load resource/.test(m.text())) && errors.push(m.text()));   // ảnh bị chặn có chủ ý
        try {
          if (s.blockImages) await page.route((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u.pathname) && !/\/app\//.test(u.pathname), (r) => r.abort());   // mô phỏng ảnh không tải được
          await page.goto(url + (s.path ?? '/') + (s.hash ?? ''), { waitUntil: 'load' });
          if (s.waitFor) await page.locator(s.waitFor).first().waitFor({ timeout: 8000 });
          for (const a of s.actions ?? []) {
            if (a.click) await page.locator(a.click).first().click();
            if (a.fill) await page.locator(a.fill[0]).first().fill(a.fill[1]);
            if (a.eval) await page.evaluate(a.eval);   // chạy một biểu thức trong trang (ví dụ điền mã ngẫu nhiên đang hiển thị)
            if (a.wait) await page.waitForTimeout(a.wait);
            if (a.waitFor) await page.locator(a.waitFor).first().waitFor({ timeout: 8000 });
          }
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
          const file = `${s.id}--${size}-${scheme === 'dark' ? 'toi' : 'sang'}.png`;
          if (s.element) await page.locator(s.element).first().screenshot({ path: path.join(OUT, file) });
          else await page.screenshot({ path: path.join(OUT, file), fullPage: !!s.fullPage });
          rows.push(`| ${s.id} | ${size} | ${scheme === 'dark' ? 'tối' : 'sáng'} | ${file} | ${errors.length ? 'LỖI: ' + errors.join('; ').slice(0, 120) : 'sạch'} |`);
          if (errors.length) failures++;
        } catch (e) {
          failures++;
          rows.push(`| ${s.id} | ${size} | ${scheme} | (không chụp được) | ${String(e.message).split('\n')[0].slice(0, 120)} |`);
        } finally {
          await page.close();
        }
      }
      await ctx.close();
    }
  }
} finally {
  await browser.close();
  await close();
}
if (only.length && fs.existsSync(path.join(OUT, 'INDEX.md'))) {   // chụp một phần: giữ các dòng của màn không chụp lại, không làm mất chỉ mục
  const old = fs.readFileSync(path.join(OUT, 'INDEX.md'), 'utf8').split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Màn') && !l.startsWith('|---') && !only.includes(l.split('|')[1].trim()));
  rows.unshift(...old);
}
const index = `# Ảnh chụp prototype\n\nMã băm prototype lúc chụp: \`${protoHash()}\`. Ảnh cũ hơn mã này có thể không còn khớp: chụp lại bằng \`node docs/ux/tools/shots.mjs\`.\nChụp lúc: ${new Date().toISOString()}\n\n| Màn | Rộng | Giao diện | Tệp | Console |\n|---|---|---|---|---|\n${rows.join('\n')}\n`;
fs.writeFileSync(path.join(OUT, 'INDEX.md'), index);
console.log(`Đã chụp ${rows.length} ảnh, ${failures} có lỗi. Xem ${path.relative(ROOT, OUT)}${path.sep}INDEX.md`);
process.exit(failures ? 1 : 0);
