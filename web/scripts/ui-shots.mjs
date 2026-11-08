// Chụp ảnh thật của giao diện web/ theo nhiều cỡ màn để tự xem lại (phục vụ kiểm UI, không chạm máy chủ thật).
//   node web/scripts/ui-shots.mjs --out=before --sizes=390x844,1440x1000 --only=home,dest [--url=http://127.0.0.1:5173] [--dark]
// Ảnh: .logs/claude-handoff/screens/<out>/<màn>--<rộng>x<cao>.png; in lỗi console/trang và tràn ngang cho từng ảnh.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { SCREENS } from './screens.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=').slice(1).join('=');
const URL_BASE = arg('url', 'http://127.0.0.1:5173').replace(/\/$/, '');
const OUT = path.resolve(import.meta.dirname, '../../.logs/claude-handoff/screens', arg('out', 'run'));
const only = arg('only', '').split(',').filter(Boolean);
const sizes = arg('sizes', '390x844').split(',').map((s) => s.split('x').map(Number));
const reduced = process.argv.includes('--reduced');
const SETTLE_MS = 1100;
const PHONE_MAX = 820;

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let problems = 0;
try {
  for (const [width, height] of sizes) {
    const phone = width < PHONE_MAX;
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, locale: 'vi-VN', reducedMotion: reduced ? 'reduce' : 'no-preference' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });
    for (const s of SCREENS.filter((x) => only.length === 0 || only.includes(x.id))) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 140)}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 140)}`));
      await page.goto(`${URL_BASE}/#/`);
      await page.evaluate(() => localStorage.clear());
      let overflow = false;
      try {
        await s.go(page, URL_BASE);
        await page.waitForTimeout(SETTLE_MS);
        overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        await page.screenshot({ path: path.join(OUT, `${s.id}--${width}x${height}.png`) });
      } catch (e) {
        errors.push(`bước chụp lỗi: ${String(e.message).split('\n')[0].slice(0, 160)}`);
      }
      problems += errors.length + (overflow ? 1 : 0);
      console.log(`${errors.length || overflow ? 'LỖI' : 'ok '} ${s.id} @${width}x${height}${overflow ? ' TRÀN-NGANG' : ''}${errors.length ? `\n   ${errors.join('\n   ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log(`Xong. ${problems} vấn đề. Ảnh: ${OUT}`);
