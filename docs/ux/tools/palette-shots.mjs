// Chụp cùng một số màn thật của prototype với từng bộ màu (docs/ux/palettes/*.css) để PO so sánh bằng mắt.
//   node docs/ux/tools/palette-shots.mjs [--only=id,id] [--sizes=390,1280] [--schemes=light,dark] [--palettes=a,b]
// Cách làm: tải prototype thật, chèn nội dung tệp bộ màu SAU app.css (ghi đè token), rồi chụp. Bộ "hien-tai" = không chèn gì.
// Ảnh: docs/ux/screenshots/palette/<bộ>/<màn>--<rộng>-<sáng|tối>.png; INDEX.md ghi lỗi console.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { ROOT, startServer } from './serve.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1];
const DEFAULT_SCREENS = 'app-explore,app-deck,app-info,app-picked,app-trips,app-trip,app-day,app-costbox,app-trash,app-security';
const only = arg('only', DEFAULT_SCREENS).split(',').filter(Boolean);
const sizes = arg('sizes', '390,1280').split(',').map(Number);
const schemes = arg('schemes', 'light,dark').split(',');
const VIEW = { 390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 1280: { width: 1280, height: 800, deviceScaleFactor: 1 } };
const PAL_DIR = path.join(ROOT, 'docs/ux/palettes');
const OUT = path.join(ROOT, 'docs/ux/screenshots/palette');
const available = fs.existsSync(PAL_DIR) ? fs.readdirSync(PAL_DIR).filter((f) => f.endsWith('.css')).map((f) => f.replace(/\.css$/, '')) : [];
const palettes = ['hien-tai', ...available].filter((p) => !arg('palettes', '') || arg('palettes', '').split(',').includes(p));
const screens = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/ux/tools/screens.json'), 'utf8')).filter((s) => only.includes(s.id));

const { url, close } = await startServer(0);
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const rows = [];
let failures = 0;
try {
  for (const pal of palettes) {
    const css = pal === 'hien-tai' ? '' : fs.readFileSync(path.join(PAL_DIR, pal + '.css'), 'utf8');
    fs.mkdirSync(path.join(OUT, pal), { recursive: true });
    for (const scheme of schemes) {
      for (const size of sizes) {
        const ctx = await browser.newContext({ viewport: { width: VIEW[size].width, height: VIEW[size].height }, deviceScaleFactor: VIEW[size].deviceScaleFactor, isMobile: !!VIEW[size].isMobile, hasTouch: !!VIEW[size].hasTouch, colorScheme: scheme, locale: 'vi-VN' });
        await ctx.addInitScript(() => { window.__WANDER_THEME = 'system'; window.__WANDER_NO_VT = true; });
        for (const s of screens) {
          const page = await ctx.newPage();
          await page.addInitScript(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) { /* bỏ qua */ } });
          const errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
          try {
            await page.goto(url + (s.path ?? '/') + (s.hash ?? ''), { waitUntil: 'load' });
            if (css) await page.addStyleTag({ content: css });
            if (s.waitFor) await page.locator(s.waitFor).first().waitFor({ timeout: 8000 });
            for (const a of s.actions ?? []) {
              if (a.click) await page.locator(a.click).first().click();
              if (a.fill) await page.locator(a.fill[0]).first().fill(a.fill[1]);
              if (a.eval) await page.evaluate(a.eval);
              if (a.wait) await page.waitForTimeout(a.wait);
              if (a.waitFor) await page.locator(a.waitFor).first().waitFor({ timeout: 8000 });
            }
            await page.evaluate(() => document.fonts.ready);
            await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});
            await page.waitForTimeout(Number(arg('settle', 1800)));   // cho hoạt họa vào màn và bản đồ ổn định rồi mới chụp
            const file = `${s.id}--${size}-${scheme === 'dark' ? 'toi' : 'sang'}.png`;
            await page.screenshot({ path: path.join(OUT, pal, file), fullPage: !!s.fullPage });
            rows.push(`| ${pal} | ${s.id} | ${size} | ${scheme === 'dark' ? 'tối' : 'sáng'} | ${pal}/${file} | ${errors.length ? 'LỖI: ' + errors.join('; ').slice(0, 120) : 'sạch'} |`);
            if (errors.length) failures++;
          } catch (e) {
            failures++;
            rows.push(`| ${pal} | ${s.id} | ${size} | ${scheme} | (không chụp được) | ${String(e.message).split('\n')[0].slice(0, 120)} |`);
          } finally {
            await page.close();
          }
        }
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  await close();
}
fs.writeFileSync(path.join(OUT, 'INDEX.md'), `# Ảnh so sánh bộ màu\n\nBộ: ${palettes.join(', ')}. Chụp lúc: ${new Date().toISOString()}\n\n| Bộ | Màn | Rộng | Giao diện | Tệp | Console |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n`);

// Trang so sánh cạnh nhau: mở thẳng tệp docs/ux/screenshots/palette/compare.html (không cần máy chủ).
const LABEL = { 'app-onb-1': 'Giới thiệu 1', 'app-onb-2': 'Giới thiệu 2', 'app-onb-3': 'Giới thiệu 3', 'app-explore': 'Trang chủ', 'app-dest': 'Trang Hà Giang', 'app-deck': 'Bắt đầu quẹt', 'app-info': 'Chi tiết địa điểm', 'app-trip': 'Chuyến đi: tổng quan', 'app-day': 'Chuyến đi: một ngày + bản đồ', 'app-picked': 'Đã chọn', 'app-create': 'Tờ lưu chuyến đi', 'app-trips': 'Danh sách chuyến đi' };
/** Đọc nội dung CSS của một bộ màu (bộ "hien-tai" là chính tokens.css). */
const palText = (pal) => fs.readFileSync(pal === 'hien-tai' ? path.join(ROOT, 'docs/ux/prototype/tokens.css') : path.join(PAL_DIR, pal + '.css'), 'utf8');
/** Các ô màu đại diện của một bộ màu. */
const swatch = (pal) => {
  const t = palText(pal);
  return ['bg', 'sky-1', 'brand-2', 'cta-g1', 'cta-2', 'sun', 'ink'].map((k) => (new RegExp('--' + k + ':\\s*([^;]+);').exec(t) || [])[1]?.trim()).filter((c) => c && c[0] === '#');
};
/** Câu mô tả của bộ màu (dòng chú thích đầu tệp). */
const note = (pal) => {
  if (pal === 'hien-tai') return 'Bản đang dùng (Nắng vàng, DR-013): kem bơ và cam nâu. Đặt vào bố cục mới để so.';
  const m = /^\/\*\s*([\s\S]+?)\*\//.exec(palText(pal));
  return m ? m[1].replace(/\s+/g, ' ').split('Chỉ ghi đè')[0].trim() : '';
};
const ids = [...new Set(screens.map((s) => s.id))];
const cell = (pal, id, size) => `<figure><img loading="lazy" src="${pal}/${id}--${size}-sang.png" alt="${LABEL[id] || id}, bộ ${pal}, ${size} px"><figcaption>${pal}</figcaption></figure>`;
let html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>So sánh bộ màu</title><style>
body{margin:0;padding:20px;font:16px/1.5 system-ui,sans-serif;background:#f4f5f7;color:#14213d}h1{font-size:26px;margin:0 0 4px}h2{font-size:20px;margin:36px 0 8px}h3{font-size:16px;margin:20px 0 6px}
.pals{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:16px 0}.pal{background:#fff;border-radius:16px;padding:14px;box-shadow:0 2px 8px #0001}.pal b{font-size:18px}.pal p{margin:6px 0 10px;font-size:14px;color:#47516b}.sw{display:flex;gap:4px}.sw i{flex:1;height:28px;border-radius:8px;border:1px solid #0002}
.row{display:flex;gap:14px;overflow-x:auto;padding:4px 2px 10px}figure{margin:0;flex:0 0 auto}img{display:block;height:560px;width:auto;border-radius:14px;box-shadow:0 4px 14px #0002;background:#fff}.w1280 img{height:auto;width:520px}figcaption{font-weight:700;padding:6px 2px}
</style></head><body><h1>So sánh bộ màu trên bố cục mới (ảnh thật của prototype)</h1><p>Cùng một màn, cùng nội dung, chỉ đổi bộ màu. Cuộn ngang để so. Giao diện sáng; tối làm sau.</p><div class="pals">${palettes.map((p) => `<div class="pal"><b>${p}</b><p>${note(p)}</p><div class="sw">${swatch(p).map((c) => `<i style="background:${c}" title="${c}"></i>`).join('')}</div></div>`).join('')}</div>`;
for (const size of sizes) {
  html += `<h2>${size === 390 ? 'Điện thoại 390 px' : 'Máy tính ' + size + ' px'}</h2>`;
  for (const id of ids) html += `<h3>${LABEL[id] || id}</h3><div class="row w${size}">${palettes.map((p) => cell(p, id, size)).join('')}</div>`;
}
html += '</body></html>';
fs.writeFileSync(path.join(OUT, 'compare.html'), html);
console.log(`Đã chụp ${rows.length} ảnh, ${failures} có lỗi. Xem ${path.relative(ROOT, OUT)}${path.sep}INDEX.md và compare.html`);
process.exit(failures ? 1 : 0);
