// Quét truy cập tự động giao diện web/ trên mọi màn của screens.mjs ở 390 và 1280 px (cùng bộ kiểm với prototype: docs/ux/tools/a11y-core.mjs).
//   node scripts/a11y.mjs [--only=home,deck] [--sizes=390,1280]
// Kiểm: tương phản chữ trên nền phẳng, vùng chạm < 44 px, điều khiển không tên, ảnh thiếu alt, id trùng, số h1, ô nhập không nhãn.
// Thoát mã 1 nếu còn phát hiện. KHÔNG kiểm được: chữ trên ảnh thật, thứ tự đọc của trình đọc màn hình, phóng 200%.
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { scan } from '../../docs/ux/tools/a11y-core.mjs';
import { SCREENS } from './screens.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1];
const only = arg('only', '').split(',').filter(Boolean);
const sizes = arg('sizes', '390,1280').split(',').map(Number);
const VIEW = { 390: { width: 390, height: 844, isMobile: true, hasTouch: true }, 1280: { width: 1280, height: 800 } };
const SETTLE_MS = 900;
const MAP_ANIMATION_MS = 800;

const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const total = { pages: 0, contrast: 0, target: 0, name: 0, img: 0, dup: 0, label: 0, h1: 0, skipped: 0 };
try {
  for (const size of sizes) {
    const ctx = await browser.newContext({ viewport: { width: VIEW[size].width, height: VIEW[size].height }, isMobile: !!VIEW[size].isMobile, hasTouch: !!VIEW[size].hasTouch, locale: 'vi-VN' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });   // đã xem giới thiệu; màn onboard vào thẳng #/onboard
    for (const s of SCREENS.filter((x) => only.length === 0 || only.includes(x.id))) {
      const page = await ctx.newPage();
      await page.goto(`${url}/#/`);
      await page.evaluate(() => localStorage.clear());
      await s.go(page, url);
      await page.waitForTimeout(SETTLE_MS);
      // bản đồ tải sau và ghim/cụm có hoạt họa rơi 0,5 giây: đợi xong rồi mới đo kích thước
      await page.waitForFunction(() => [...document.querySelectorAll('.tmroot')].every((m) => m.dataset.ready !== '0'), undefined, { timeout: 20000 }).catch(() => undefined);
      await page.waitForTimeout(MAP_ANIMATION_MS);
      const r = await page.evaluate(scan);
      total.pages += 1;
      for (const k of ['contrast', 'target', 'name', 'img', 'dup', 'label']) total[k] += r[k].length;
      total.h1 += r.h1 === 1 ? 0 : 1;
      total.skipped += r.skipped;
      const found = ['contrast', 'target', 'name', 'img', 'dup', 'label'].flatMap((k) => r[k].map((x) => `${k}: ${typeof x === 'string' ? x : JSON.stringify(x)}`));
      if (r.h1 !== 1) found.push(`h1: ${r.h1} thẻ h1`);
      console.log(`${found.length ? 'LỖI' : 'ok '} ${s.id} @${size}${found.length ? `\n   ${found.join('\n   ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}
const bad = total.contrast + total.target + total.name + total.img + total.dup + total.label + total.h1;
console.log(`Quét ${total.pages} trang: tương phản ${total.contrast} · vùng chạm ${total.target} · thiếu tên ${total.name} · ảnh thiếu alt ${total.img} · id trùng ${total.dup} · ô nhập không nhãn ${total.label} · h1 sai ${total.h1} · chữ trên ảnh/gradient bỏ qua ${total.skipped}`);
process.exit(bad ? 1 : 0);
