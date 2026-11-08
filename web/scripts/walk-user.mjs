// Đi thử app như người dùng mới (điện thoại 390×844) trên backend thật đang chạy, chụp từng màn và đo lỗi giao diện cơ bản.
// Chạy: node web/scripts/walk-user.mjs [baseUrl] [outDir]   (mặc định http://localhost:8787, .tmp/walk)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:8787';
const OUT = path.resolve(process.argv[3] ?? '.tmp/walk');
const VIEWPORT = { width: 390, height: 844 };
const MIN_TAP = 44;
const MIN_FONT = 12;
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
let step = 0;

/** Đo lỗi giao diện thường gặp trên màn hiện tại: tràn ngang, ảnh hỏng, chữ nhỏ, vùng chạm nhỏ, nút không tên. */
async function audit(page) {
  return page.evaluate(({ MIN_TAP, MIN_FONT }) => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < innerHeight; };
    const brokenImages = [...document.images].filter((i) => vis(i) && (!i.complete || i.naturalWidth === 0)).map((i) => i.currentSrc.slice(-60));
    const smallTaps = [...document.querySelectorAll('button, a[href], [role=button], input, select')].filter(vis).filter((el) => { const r = el.getBoundingClientRect(); return r.width < MIN_TAP || r.height < MIN_TAP; }).map((el) => `${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)} ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
    const tinyText = new Set();
    for (const el of document.querySelectorAll('body *')) { if (!vis(el) || !el.childNodes.length) continue; const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1); if (own && parseFloat(getComputedStyle(el).fontSize) < MIN_FONT) tinyText.add(`${el.textContent.trim().slice(0, 20)} (${getComputedStyle(el).fontSize})`); }
    const unnamed = [...document.querySelectorAll('button, a[href]')].filter(vis).filter((el) => !(el.getAttribute('aria-label') || el.textContent.trim() || el.getAttribute('title'))).length;
    return {
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      brokenImages, smallTaps: smallTaps.slice(0, 8), tinyText: [...tinyText].slice(0, 6), unnamedButtons: unnamed,
      buttons: [...document.querySelectorAll('button, a[href]')].filter(vis).map((el) => (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 28)).filter(Boolean).slice(0, 14),
      headline: (document.querySelector('h1, h2')?.textContent ?? '').trim().slice(0, 50),
    };
  }, { MIN_TAP, MIN_FONT });
}

/** Chụp màn hiện tại, đo lỗi, in một dòng JSON. */
async function snap(page, name, fullPage = false) {
  step += 1;
  const file = `${String(step).padStart(2, '0')}-${name}.png`;
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, file), fullPage });
  const a = await audit(page);
  console.log(JSON.stringify({ file, url: page.url().split('#')[1] ?? '', ...a }));
}

/** Làm một bước, lỗi thì ghi lại và đi tiếp. */
async function attempt(label, fn) {
  try { await fn(); } catch (e) { console.log(`STEP FAILED ${label}: ${String(e.message).split('\n')[0].slice(0, 140)}`); }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const ctx = await browser.newContext({ viewport: VIEWPORT, isMobile: true, hasTouch: true, locale: 'vi-VN' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(-70)}`); });

const t0 = Date.now();
await page.goto(`${BASE}/`, { waitUntil: 'load' });
console.log(`load ${Date.now() - t0}ms`);
await snap(page, 'mo-app-lan-dau');

await attempt('giới thiệu', async () => {
  for (let i = 0; i < 3; i += 1) { await page.getByRole('button', { name: 'Tiếp', exact: true }).click({ timeout: 4000 }); await snap(page, `gioi-thieu-${i + 2}`); }
  await page.getByRole('button', { name: 'Bắt đầu khám phá', exact: true }).click({ timeout: 4000 });
});
await snap(page, 'sau-gioi-thieu');

await attempt('chọn điểm đến', async () => {
  await page.locator('.destination-picker-list button, .nh-card').filter({ hasText: 'Hà Nội' }).first().click({ timeout: 6000 });
});
await snap(page, 'sau-chon-diem-den');

await attempt('quẹt thẻ', async () => {
  for (let i = 0; i < 3; i += 1) { await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).first().click({ timeout: 4000 }); await page.waitForTimeout(400); }
  await snap(page, 'quet-da-chon-3');
});

await attempt('về Khám phá', async () => { await page.getByRole('button', { name: 'Quay lại', exact: true }).first().click({ timeout: 4000 }); await page.waitForURL(/#\/$/, { timeout: 4000 }); });
await snap(page, 'trang-chu-da-chon');
await attempt('trang chủ cuộn', async () => { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await snap(page, 'trang-chu-cuoi'); });

await attempt('khoảnh khắc', async () => {
  const sec = page.locator('section', { hasText: 'Khoảnh khắc' }).first();
  await sec.scrollIntoViewIfNeeded({ timeout: 4000 });
  await snap(page, 'khoanh-khac');
  await sec.locator('button img, img').first().click({ timeout: 4000 });
  await snap(page, 'khoanh-khac-xem-lon');
  await page.keyboard.press('Escape');
});

await attempt('Đã chọn', async () => { await page.locator('#tabbar').getByRole('button', { name: /Đã chọn/ }).click({ timeout: 4000 }); });
await snap(page, 'da-chon');

await attempt('Chuyến đi', async () => { await page.locator('#tabbar').getByRole('button', { name: /Chuyến đi/ }).click({ timeout: 4000 }); });
await snap(page, 'chuyen-di');

console.log('--- lỗi mạng/console:', JSON.stringify([...new Set(errors)].slice(0, 12)));
await browser.close();
