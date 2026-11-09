// Chạy toàn bộ danh sách màn (screens.mjs) trên nhiều "máy": Chrome/Edge máy tính, WebKit (lõi Safari) máy tính, Chrome Android, Safari iPhone.
//   npm --prefix web run xbrowser -- [--only=home,deck] [--profiles=iphone-safari,android-chrome] [--settle=600]
// Với mỗi màn: lỗi console/trang/HTTP, tràn ngang, vùng chạm < 44 px, chữ < 12 px, và "trang chính có cuộn không" (iOS Safari chỉ thu nhỏ thanh địa chỉ khi TRANG cuộn).
// Ảnh: .logs/cross-browser/<máy>/<màn>.png; tóm tắt JSON: .logs/cross-browser/summary.json. Cần backend thật ở 8787 (WANDER_E2E_DB=wander_e2e).
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium, webkit, devices } from 'playwright-core';
import { visibleReviewImagesReady } from './reviewImages.mjs';

const { SCREENS } = await import('./screens.mjs');
const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=').slice(1).join('=');
const only = arg('only', '').split(',').filter(Boolean);
const skip = arg('skip', '').split(',').filter(Boolean);   // màn bỏ qua (vd. màn tạo danh tính khi chạy vào production)
const wanted = arg('profiles', '').split(',').filter(Boolean);
const SETTLE_MS = Number(arg('settle', '600'));
const DEADLINE_MS = Number(arg('deadline', '45000'));
const OUT = path.resolve(import.meta.dirname, '../../.logs/cross-browser');
const MIN_TAP_PX = 44;
const MIN_FONT_PX = 12;

/** Các "máy" cần thử. `launch` chọn trình duyệt; `ctx` là tùy chọn ngữ cảnh (khung nhìn, UA, cảm ứng). */
const PROFILES = [
  { id: 'desktop-chrome', launch: () => chromium.launch({ channel: 'chrome', headless: true }), ctx: { viewport: { width: 1440, height: 900 } } },
  { id: 'desktop-edge', launch: () => chromium.launch({ channel: 'msedge', headless: true }), ctx: { viewport: { width: 1280, height: 800 } } },
  { id: 'desktop-webkit', launch: () => webkit.launch({ headless: true }), ctx: { viewport: { width: 1440, height: 900 } } },
  { id: 'android-chrome', launch: () => chromium.launch({ channel: 'chrome', headless: true }), ctx: { ...devices['Pixel 7'] } },
  { id: 'iphone-safari', launch: () => webkit.launch({ headless: true }), ctx: { ...devices['iPhone 15'] } },
  { id: 'iphone-se-safari', launch: () => webkit.launch({ headless: true }), ctx: { ...devices['iPhone SE'] } },
].filter((p) => wanted.length === 0 || wanted.includes(p.id));

// --base=<url>: kiểm một bản đã triển khai (không mở Vite, không cần backend local). Không có thì dùng Vite + backend thật ở 8787.
const base = arg('base', '');
const server = base ? null : await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server?.listen();
const url = (base || server.resolvedUrls.local[0]).replace(/\/$/, '');
if (!base) {
  const live = await fetch('http://127.0.0.1:8787/api/catalog/destinations').then((r) => r.ok).catch(() => false);
  if (!live) throw new Error('Cần backend thật ở 8787 (tools\\dev.ps1 run hoặc e2e).');
}

/** Đo trong trang: vùng chạm nhỏ, chữ nhỏ, tràn ngang, trang chính có cuộn không. Chạy trong trình duyệt. */
function measure({ minTap, minFont }) {
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth; };
  const name = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}`;
  const small = new Map();
  for (const el of document.querySelectorAll('button, a[href], [role=button], [role=tab], input:not([type=hidden]), select')) {
    if (!visible(el) || el.closest('.maplibregl-map, .tmroot, [aria-hidden=true]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < minTap || r.height < minTap) small.set(name(el), (small.get(name(el)) ?? 0) + 1);
  }
  const tiny = new Map();
  for (const el of document.querySelectorAll('body *')) {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!visible(el) || el.closest('.maplibregl-map, .tmroot, svg')) continue;
    const px = parseFloat(getComputedStyle(el).fontSize);
    if (px < minFont) tiny.set(`${name(el)} ${px}px`, (tiny.get(`${name(el)} ${px}px`) ?? 0) + 1);
  }
  const screenEl = document.getElementById('screen');
  return {
    overflowX: document.documentElement.scrollWidth > innerWidth + 1,
    smallTap: [...small].sort((a, b) => b[1] - a[1]).slice(0, 6),
    tinyText: [...tiny].sort((a, b) => b[1] - a[1]).slice(0, 4),
    pageScrolls: document.documentElement.scrollHeight > innerHeight + 1,
    innerScrollable: !!screenEl && screenEl.scrollHeight > screenEl.clientHeight + 1,
    vh: innerHeight,
  };
}

/** Chạy mọi màn trên một máy; trả về kết quả từng màn. */
async function runProfile(profile) {
  const dir = path.join(OUT, profile.id);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await profile.launch();
  const results = [];
  try {
    const ctx = await browser.newContext({ locale: 'vi-VN', ...profile.ctx });
    for (const s of SCREENS.filter((x) => (only.length === 0 || only.includes(x.id)) && !skip.includes(x.id))) {
      const page = await ctx.newPage();
      page.setDefaultTimeout(25000);
      // Đã xem giới thiệu, trừ các màn giới thiệu (onboard-*) cần chính màn đó hiện ra.
      if (!s.id.startsWith('onboard')) await page.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error' && !m.text().startsWith('Failed to load resource')) errors.push(`console: ${m.text().slice(0, 160)}`); });
      page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().replace(url, '')}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 160)}`));
      let m = null;
      let timer;
      try {
        await page.goto(`${url}/#/`);
        await page.evaluate(() => localStorage.clear());
        await Promise.race([s.go(page, url), new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`quá hạn ${DEADLINE_MS} ms`)), DEADLINE_MS); })]);
        await page.waitForTimeout(SETTLE_MS);
        await page.waitForFunction(visibleReviewImagesReady).catch(() => undefined);
        m = await page.evaluate(measure, { minTap: MIN_TAP_PX, minFont: MIN_FONT_PX });
        await page.screenshot({ path: path.join(dir, `${s.id}.png`) });
      } catch (e) {
        errors.push(`bước lỗi: ${e.message.split('\n')[0]}`);
        await page.screenshot({ path: path.join(dir, `${s.id}--LOI.png`) }).catch(() => undefined);
      } finally {
        clearTimeout(timer);
        await page.close().catch(() => undefined);
      }
      results.push({ screen: s.id, errors, ...(m ?? {}) });
      console.log(`${profile.id.padEnd(16)} ${errors.length ? 'LỖI' : 'ok '} ${s.id}${m?.overflowX ? ' TRÀN-NGANG' : ''}${errors.length ? ' :: ' + errors[0] : ''}`);
    }
    await ctx.close();
  } finally {
    await browser.close();
  }
  return { profile: profile.id, results };
}

try {
  const all = await Promise.all(PROFILES.map(runProfile));
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(all, null, 1));
  for (const { profile, results } of all) {
    const bad = results.filter((r) => r.errors.length);
    console.log(`\n== ${profile}: ${results.length} màn, ${bad.length} màn lỗi, ${results.filter((r) => r.overflowX).length} tràn ngang, ${results.filter((r) => r.smallTap?.length).length} màn có vùng chạm <${MIN_TAP_PX}px`);
  }
} finally {
  await server?.close();
}
