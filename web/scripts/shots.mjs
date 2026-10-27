// Chụp ảnh thật của giao diện web/ (pha FE) ở điện thoại 390 px và máy tính 1280 px, và báo lỗi console/lỗi trang.
//   node scripts/shots.mjs [--only=home,deck] [--sizes=390,1280]
// Tự mở máy chủ Vite (kho biên tập thật phục vụ qua plugin trong vite.config.ts). Ảnh: docs/ux/screenshots/web/<màn>--<rộng>.png
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { SCREENS } from './screens.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1];
const only = arg('only', '').split(',').filter(Boolean);
const sizes = arg('sizes', '390,1280').split(',').map(Number);
const OUT = path.resolve(import.meta.dirname, '../../docs/ux/screenshots/web');
const VIEW = { 390: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 1280: { width: 1280, height: 800, deviceScaleFactor: 1 } };
const SETTLE_MS = 900;


fs.mkdirSync(OUT, { recursive: true });
const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let problems = 0;
try {
  for (const size of sizes) {
    const ctx = await browser.newContext({ viewport: { width: VIEW[size].width, height: VIEW[size].height }, deviceScaleFactor: VIEW[size].deviceScaleFactor, isMobile: !!VIEW[size].isMobile, hasTouch: !!VIEW[size].hasTouch, locale: 'vi-VN' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });   // đã xem giới thiệu; màn onboard vào thẳng #/onboard
    for (const s of SCREENS.filter((x) => only.length === 0 || only.includes(x.id))) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
      await page.goto(`${url}/#/`);
      await page.evaluate(() => localStorage.clear());
      try {
        await s.go(page, url);
        await page.waitForTimeout(SETTLE_MS);
        await page.screenshot({ path: path.join(OUT, `${s.id}--${size}.png`) });
      } catch (e) {
        errors.push(`bước chụp lỗi: ${e.message.split('\n')[0]}`);
      }
      problems += errors.length;
      console.log(`${errors.length ? 'LỖI' : 'ok '} ${s.id} @${size}${errors.length ? `\n   ${errors.join('\n   ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`Xong. ${problems} vấn đề. Ảnh: ${OUT}`);
process.exit(problems ? 1 : 0);
