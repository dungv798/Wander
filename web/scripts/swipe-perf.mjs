// Đo độ mượt khi kéo/quẹt thẻ: ghi lại khoảng cách giữa các khung hình (rAF) trong lúc kéo và sau khi thả.
// Chạy: node scripts/swipe-perf.mjs  (tự mở máy chủ Vite + Chrome/Edge, không cần backend)
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server.listen();
const base = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));

/** Đo một cú kéo từ giữa thẻ sang phải; trả khung dài nhất và số khung > 24 ms. */
async function measure(viewport, label) {
  const ctx = await browser.newContext({ viewport, locale: 'vi-VN' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });   // đã xem giới thiệu; màn onboard vào thẳng #/onboard
  const page = await ctx.newPage();
  await page.goto(`${base}/#/`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/#/deck/ha-giang`);
  await page.waitForSelector('.card.front');
  await page.waitForTimeout(1200);
  const runs = [];
  for (let k = 0; k < 4; k += 1) {
    await page.evaluate(() => {
      window.__frames = [];
      let last = performance.now();
      const tick = (t) => { window.__frames.push(t - last); last = t; window.__raf = requestAnimationFrame(tick); };
      window.__raf = requestAnimationFrame(tick);
    });
    const box = await page.locator('.card.front').boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    for (let i = 1; i <= 24; i += 1) { await page.mouse.move(cx + i * 12, cy + i * 2); await page.waitForTimeout(8); }
    await page.mouse.up();
    await page.waitForTimeout(900);
    const frames = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__frames.slice(1); });
    runs.push({ worst: Math.max(...frames), slow: frames.filter((f) => f > 24).length, n: frames.length });
  }
  console.log(label, runs.map((r) => `worst ${r.worst.toFixed(0)}ms, >24ms: ${r.slow}/${r.n}`).join(' | '));
  await ctx.close();
}

await measure({ width: 390, height: 844 }, 'điện thoại 390');
await measure({ width: 1280, height: 800 }, 'máy tính 1280');
await browser.close();
await server.close();
