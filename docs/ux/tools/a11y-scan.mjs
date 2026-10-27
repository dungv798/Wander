// Quét truy cập tự động trên MỌI màn trong screens.json (kể cả các bước bấm), ở 390 và 1280, sáng và tối.
//   node docs/ux/tools/a11y-scan.mjs [--only=id,id] [--sizes=390,1280] [--schemes=light,dark] [--strict]
// Kiểm: (1) tương phản chữ thật so với nền PHẲNG phía sau (chữ trên ảnh/gradient bị bỏ qua, ghi số lượng), 4,5:1 (chữ lớn 3:1);
// (2) vùng chạm < 44 px; (3) điều khiển không có tên truy cập; (4) ảnh thiếu alt; (5) id trùng; (6) số thẻ h1 trong màn;
// (7) ô nhập không có nhãn. KHÔNG kiểm được: chữ trên ảnh thật, thứ tự đọc của trình đọc màn hình, phóng 200% (xem screens.md).
// --strict: thoát mã 1 nếu còn lỗi tương phản hoặc thiếu tên.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { startServer, ROOT } from './serve.mjs';

const arg = (k, d) => (process.argv.find((x) => x.startsWith('--' + k + '=')) ?? '').split('=')[1] ?? d;
const only = arg('only', '') ? arg('only', '').split(',') : null;
const sizes = arg('sizes', '390,1280').split(',').map(Number);
const schemes = arg('schemes', 'light,dark').split(',');
const strict = process.argv.includes('--strict');
const screens = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/ux/tools/screens.json'), 'utf8')).filter((s) => s.id.startsWith('app-') && (!only || only.includes(s.id)));

const { url, close } = await startServer(0);
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));

import { scan } from './a11y-core.mjs';


const total = { broken: 0, contrast: 0, name: 0, target: 0, img: 0, dup: 0, label: 0, h1bad: 0, skipped: 0, pages: 0 };
const lines = [];
for (const size of sizes) {
  for (const scheme of schemes) {
    const ctx = await browser.newContext({ viewport: { width: size, height: size === 390 ? 844 : 800 }, colorScheme: scheme, locale: 'vi-VN', isMobile: size === 390, hasTouch: size === 390, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => { window.__WANDER_THEME = 'system'; window.__WANDER_NO_VT = true; });   // app mặc định sáng; ở đây mô phỏng hệ thống sáng/tối
    for (const s of screens) {
      const page = await ctx.newPage();
      await page.addInitScript(() => { try { localStorage.clear(); } catch (e) { /* bỏ qua */ } });
      try {
        if (s.blockImages) await page.route((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u.pathname) && !/\/app\//.test(u.pathname), (r) => r.abort());   // mô phỏng ảnh không tải được
        await page.goto(url + (s.path ?? '/'), { waitUntil: 'load' });
        if (s.waitFor) await page.locator(s.waitFor).first().waitFor({ timeout: 8000 });
        for (const a of s.actions ?? []) {
          if (a.click) await page.locator(a.click).first().click();
          if (a.fill) await page.locator(a.fill[0]).first().fill(a.fill[1]);
          if (a.eval) await page.evaluate(a.eval);   // chạy một biểu thức trong trang (ví dụ điền mã ngẫu nhiên đang hiển thị)
          if (a.wait) await page.waitForTimeout(a.wait);
          if (a.waitFor) await page.locator(a.waitFor).first().waitFor({ timeout: 8000 });
        }
        await page.evaluate(() => document.fonts.ready);
        const r = await page.evaluate(scan);
        total.pages++; total.contrast += r.contrast.length; total.name += r.name.length; total.target += r.target.length; total.img += r.img.length; total.dup += r.dup.length; total.label += r.label.length; total.skipped += r.skipped;
        const h1ok = r.h1 === 1 || /app-(deck|info|day|plan|addday|share|review|add-item|item-edit|create|edit|sorting|day2|member)/.test(s.id) && r.h1 <= 2;
        if (!h1ok) total.h1bad++;
        const bits = [];
        if (r.contrast.length) bits.push('TƯƠNG PHẢN: ' + r.contrast.slice(0, 4).join('; ') + (r.contrast.length > 4 ? ` (+${r.contrast.length - 4})` : ''));
        if (r.name.length) bits.push('THIẾU TÊN: ' + r.name.slice(0, 4).join('; '));
        if (r.label.length) bits.push('Ô NHẬP KHÔNG NHÃN: ' + r.label.slice(0, 4).join('; '));
        if (r.target.length) bits.push('VÙNG CHẠM: ' + r.target.slice(0, 4).join('; ') + (r.target.length > 4 ? ` (+${r.target.length - 4})` : ''));
        if (r.img.length) bits.push('ẢNH THIẾU alt: ' + r.img.slice(0, 2).join('; '));
        if (r.dup.length) bits.push('ID TRÙNG: ' + r.dup.join(', '));
        if (!h1ok) bits.push('h1=' + r.h1);
        if (bits.length) lines.push(`[${size} ${scheme}] ${s.id}\n   ` + bits.join('\n   '));
      } catch (e) { total.broken++; lines.push(`[${size} ${scheme}] ${s.id}: không quét được (${String(e.message).split('\n')[0]})`); }
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
await close();
console.log(lines.join('\n') || '(không có phát hiện)');
console.log(`\nQuét ${total.pages} trang: tương phản ${total.contrast} · thiếu tên ${total.name} · ô nhập không nhãn ${total.label} · vùng chạm ${total.target} · ảnh thiếu alt ${total.img} · id trùng ${total.dup} · h1 sai ${total.h1bad} · chữ trên ảnh/gradient bỏ qua ${total.skipped}`);
if (strict && (total.broken || total.contrast || total.name || total.label || total.img || total.dup || total.target)) process.exit(1);
