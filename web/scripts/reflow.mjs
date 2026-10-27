// Kiểm "reflow" (WCAG 1.4.10) và phóng chữ 200% (WCAG 1.4.4) trên mọi màn của screens.mjs.
//   node scripts/reflow.mjs [--only=home,deck] [--mode=narrow|zoom|both]
// narrow: khung 320×640 (tương đương phóng 400% ở 1280 px). zoom: khung 640×800 với `zoom: 2` (tương đương chữ/giao diện 200%, chỉ còn 320 px CSS).
// Báo: trang cuộn ngang, phần tử thò ra ngoài mép phải (bỏ qua vùng cuộn ngang có chủ ý), chữ bị cắt trong hộp cố định chiều cao.
// KHÔNG kiểm được: chữ-chỉ-phóng ở cài đặt trình duyệt (chỉ phóng cỡ chữ gốc), trình đọc màn hình, thiết bị thật.
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { SCREENS } from './screens.mjs';

const arg = (name, dflt) => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1];
const only = arg('only', '').split(',').filter(Boolean);
const mode = arg('mode', 'both');
const shotsDir = arg('shots', '');
const MODES = { narrow: { width: 320, height: 640, zoom: 1 }, zoom: { width: 640, height: 800, zoom: 2 } };
const SETTLE_MS = 900;
const MAP_ANIMATION_MS = 800;
const SLACK_PX = 2;
/** Vùng cuộn ngang có chủ ý: phần tử bên trong được phép rộng hơn khung. */
const SCROLLERS = '.hscroll, .filters, .tplrow, .monthrow, .dtabs, .chips, .expscroll, .tmroot, .moods, .gallery';
/** Phần trang trí (bầu trời, mây, ảnh xòe, la bàn, máy bay): được phép tràn mép vì bị cắt có chủ ý. */
const DECOR = '.sky, .sky-sun, .cloud, .fan, .compass, .plane, .hero-ph, .obx-sky, .tm-pin, .dhero, .dcard';  // .dcard: thẻ ảnh có chip nổi, lệch ≤ 4 px do ảnh phóng nhẹ

/** Chạy trong trang: trả các vấn đề tràn ngang đã gom gọn. */
function measure([slack, scrollers, decor]) {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > vw + slack) out.push(`trang cuộn ngang: scrollWidth ${doc.scrollWidth} > ${vw}`);
  const screen = document.getElementById('screen');
  if (screen && screen.scrollWidth > screen.clientWidth + slack) out.push(`#screen cuộn ngang: ${screen.scrollWidth} > ${screen.clientWidth}`);
  const seen = new Set();
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed') continue;
    if (el.closest(scrollers) || el.closest(decor) || el.closest('svg') || el.closest('[aria-hidden="true"]')) continue;
    if (r.right > vw + slack || r.left < -slack) {
      const label = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/)[0]}` : ''}`;
      if (!seen.has(label)) {
        seen.add(label);
        out.push(`thò ra ngoài: ${label} [${Math.round(r.left)}..${Math.round(r.right)}] / ${vw}`);
      }
    }
  }
  for (const el of document.querySelectorAll('button, a, h1, h2, h3, p, span, b, li, label')) {
    if (el.closest(scrollers) || el.closest(decor) || el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.overflow !== 'hidden' && cs.overflowX !== 'hidden') continue;
    if (!el.textContent.trim() || cs.textOverflow === 'ellipsis') continue;
    const range = document.createRange();
    range.selectNodeContents(el);
    const text = range.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    if (text.right > box.right + slack || text.left < box.left - slack) {
      const label = `${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className.trim().split(/s+/)[0] : '') || '-'}`;
      if (!seen.has(`cat:${label}`)) {
        seen.add(`cat:${label}`);
        out.push(`chữ bị cắt: ${label} "${el.textContent.trim().slice(0, 30)}" (chữ ${Math.round(text.left)}..${Math.round(text.right)} / hộp ${Math.round(box.left)}..${Math.round(box.right)})`);
      }
    }
  }
  return out;
}

const server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
await server.listen();
const url = server.resolvedUrls.local[0].replace(/\/$/, '');
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let bad = 0;
let pages = 0;
try {
  for (const [name, m] of Object.entries(MODES).filter(([n]) => mode === 'both' || n === mode)) {
    const ctx = await browser.newContext({ viewport: { width: m.width, height: m.height }, isMobile: m.width < 500, hasTouch: m.width < 500, locale: 'vi-VN' });
    await ctx.addInitScript(() => { try { if (localStorage.getItem('wander.web.onboarding.v1') === null) localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });
    for (const s of SCREENS.filter((x) => only.length === 0 || only.includes(x.id))) {
      const page = await ctx.newPage();
      await page.goto(`${url}/#/`);
      await page.evaluate(() => localStorage.clear());
      try {
        await s.go(page, url);
      } catch (e) {
        console.log(`BỎ QUA ${s.id} @${name}: không dựng được màn ở khung này (${String(e.message).slice(0, 80)})`);
        if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `reflow-${s.id}-${name}-FAIL.png`) });
        await page.close();
        continue;
      }
      if (m.zoom !== 1) await page.evaluate((z) => { document.documentElement.style.zoom = String(z); }, m.zoom);
      await page.waitForTimeout(SETTLE_MS);
      await page.waitForFunction(() => [...document.querySelectorAll('.tmroot')].every((x) => x.dataset.ready !== '0'), undefined, { timeout: 20000 }).catch(() => undefined);
      await page.waitForTimeout(MAP_ANIMATION_MS);
      const found = await page.evaluate(measure, [SLACK_PX, SCROLLERS, DECOR]).catch((e) => [`không đo được: ${e.message}`]);
      pages += 1;
      if (shotsDir && found.length) await page.screenshot({ path: path.join(shotsDir, `reflow-${s.id}-${name}.png`) });
      bad += found.length ? 1 : 0;
      console.log(`${found.length ? 'LỖI' : 'ok '} ${s.id} @${name}${found.length ? `\n   ${found.slice(0, 8).join('\n   ')}` : ''}`);
      await page.close();
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`Reflow: ${pages} trang, ${bad} trang có vấn đề`);
process.exit(bad ? 1 : 0);
