// Chụp ảnh thật của giao diện web/ (pha FE) theo nhiều cỡ màn, và báo lỗi console/lỗi trang/tràn ngang.
//   npm --prefix web run shots -- --only=home,deck --sizes=390x844,1440x1000 --out=before [--reduced]
// Mặc định (không tham số): 390x844 và 1280x800, ảnh vào docs/ux/screenshots/web/. Có --out=<tên>: ảnh vào .logs/claude-handoff/screens/<tên>/.
// Tự mở máy chủ Vite (kho biên tập thật phục vụ qua plugin trong vite.config.ts). Tên ảnh: <màn>--<rộng>x<cao>.png (hoặc <màn>--<rộng>.png ở chế độ mặc định).
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { startCatalogStub } from './catalogStub.mjs';
import { visibleReviewImagesReady } from './reviewImages.mjs';

// Backend e2e do Codex điều phối ghi trạng thái ở .logs/claude-handoff/backend-ready.json: dùng nó cho các màn cần phiên (seed) nếu môi trường chưa đặt sẵn.
try {
  const ready = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../.logs/claude-handoff/backend-ready.json'), 'utf8').replace(/^﻿/, ''));
  if (ready.state === 'ready') {
    process.env.WANDER_E2E_DB ??= ready.screenshotEnvironment?.WANDER_E2E_DB ?? ready.database;
    process.env.WANDER_BASE_URL ??= ready.screenshotEnvironment?.WANDER_BASE_URL ?? ready.baseUrl;
  }
} catch { /* không có tệp: chỉ chụp được các màn danh mục */ }
const { SCREENS } = await import('./screens.mjs');

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=').slice(1).join('=');
const only = arg('only', '').split(',').filter(Boolean);
const customOut = arg('out', '');
const reduced = process.argv.includes('--reduced');
const production = process.argv.includes('--production');
const dark = process.argv.includes('--dark');   // kiểm tính đọc được của bộ màu tối sau token chung (chưa tinh chỉnh theo quyết định của PO)
const DEFAULT_SIZES = '390x844,1280x800';
const sizes = arg('sizes', DEFAULT_SIZES).split(',').map((s) => s.split('x').map(Number));
const OUT = customOut
  ? path.resolve(import.meta.dirname, '../../.logs/claude-handoff/screens', customOut)
  : path.resolve(import.meta.dirname, '../../docs/ux/screenshots/web');
const SETTLE_MS = Number(arg('settle', '1000'));
const DEADLINE_MS = Number(arg('deadline', '60000'));
const PHONE_MAX_WIDTH = 820;
const MAP_READY_TIMEOUT_MS = 20000;

fs.mkdirSync(OUT, { recursive: true });
const server = production ? null : await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server?.listen();
const url = production ? (process.env.WANDER_BASE_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '') : server.resolvedUrls.local[0].replace(/\/$/, '');
const BACKEND_PORT = 8787;
const live = await fetch(`http://127.0.0.1:${BACKEND_PORT}/api/catalog/destinations`).then((r) => r.ok).catch(() => false);
let stopStub = async () => {};
if (live) console.log('Backend thật đang chạy ở 8787: dùng nó.');
else {
  if (production) throw new Error('Chụp production cần backend thật đang chạy; không dùng stub thay thế.');
  stopStub = await startCatalogStub(BACKEND_PORT);
  console.log('Backend không chạy: dùng máy chủ danh mục CHỈ ĐỌC dựng từ JSON biên tập thật (catalogStub.mjs). Màn cần phiên/chuyến đi sẽ lỗi.');
}
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let problems = 0;
try {
  for (const [width, height] of sizes) {
    const phone = width < PHONE_MAX_WIDTH;
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, locale: 'vi-VN', reducedMotion: reduced ? 'reduce' : 'no-preference', colorScheme: dark ? 'dark' : 'light' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });   // đã xem giới thiệu; màn onboard vào thẳng #/onboard
    try {
    // Bộ màu tối chưa có lối bật trong ứng dụng ("sáng là mặc định"): ép `data-theme=dark` để kiểm tính đọc được sau token chung.
    if (dark) await ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.theme = 'dark'; }); });
    for (const s of SCREENS.filter((x) => only.length === 0 || only.includes(x.id))) {
      const page = await ctx.newPage();
      page.setDefaultTimeout(Math.min(25000, DEADLINE_MS));
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text()}`); });
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().replace(url, '')}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => { if (r.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ''}`); });   // yêu cầu bị hủy chủ ý (AbortController) không phải lỗi
      await page.goto(`${url}/#/`);
      await page.evaluate(() => localStorage.clear());
      let overflow = false;
      let timer;
      try {
        // Mỗi màn có hạn chót: quá hạn thì báo lỗi thay vì treo cả lượt chụp (trình duyệt và máy chủ vẫn được đóng ở finally).
        await Promise.race([s.go(page, url), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`quá hạn ${DEADLINE_MS} ms`)), DEADLINE_MS); })]);
        if (await page.locator('.shell-map, .tmap').first().isVisible()) {
          await page.waitForFunction(() => {
            const host = document.querySelector('.shell-map .tmroot, .tmroot.tmap');
            return host?.dataset.ready === '1' && host.dataset.moving === '0' && (Number(host.dataset.pins) > 0 || Number(host.dataset.clusters) > 0);
          }, null, { timeout: MAP_READY_TIMEOUT_MS });
        }
        await page.waitForTimeout(SETTLE_MS);
        await page.waitForFunction(visibleReviewImagesReady);
        overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        const name = customOut ? `${s.id}--${width}x${height}.png` : `${s.id}--${width}.png`;
        await page.screenshot({ path: path.join(OUT, name) });
      } catch (e) {
        errors.push(`bước chụp lỗi: ${e.message.split('\n')[0]}`);
        // Vẫn chụp trạng thái lúc lỗi để biết màn đang ở đâu.
        await page.screenshot({ path: path.join(OUT, `${s.id}--${width}x${height}--LOI.png`) }).catch(() => undefined);
      } finally {
        clearTimeout(timer);
      }
      problems += errors.length + (overflow ? 1 : 0);
      console.log(`${errors.length || overflow ? 'LỖI' : 'ok '} ${s.id} @${width}x${height}${overflow ? ' TRÀN-NGANG' : ''}${errors.length ? `\n   ${errors.join('\n   ')}` : ''}`);
      await page.close().catch(() => undefined);
    }
    } finally {
      await ctx.close().catch(() => undefined);
    }
  }
} finally {
  await browser.close();
  await server?.close();
  await stopStub();
}
console.log(`Xong. ${problems} vấn đề. Ảnh: ${OUT}`);
process.exit(problems ? 1 : 0);
