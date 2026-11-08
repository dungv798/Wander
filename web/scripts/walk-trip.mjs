// Đi tiếp như người dùng: chọn nơi → lưu thành chuyến → xem tổng quan/ngày → chi phí → xuất. Chụp từng màn, in nút hiện có.
// Chạy: node web/scripts/walk-trip.mjs [baseUrl] [outDir]
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.argv[2] ?? 'http://localhost:8787';
const OUT = path.resolve(process.argv[3] ?? '.tmp/walk');
let step = 20;
const errors = [];

/** Chụp màn hiện tại và in tiêu đề, tràn ngang, ảnh hỏng, danh sách nút nhìn thấy. */
async function snap(page, name, wait = 900) {
  step += 1;
  await page.waitForTimeout(wait);
  const file = `${step}-${name}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  const info = await page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
    return {
      h: (document.querySelector('h1, h2')?.textContent ?? '').trim().slice(0, 40),
      overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      broken: [...document.images].filter((i) => vis(i) && i.complete && i.naturalWidth === 0).length,
      buttons: [...document.querySelectorAll('button, a[href], [role=tab]')].filter(vis).map((el) => (el.getAttribute('aria-label') || el.textContent).trim().replace(/\s+/g, ' ').slice(0, 26)).filter(Boolean).slice(0, 16),
    };
  });
  console.log(JSON.stringify({ file, url: page.url().split('#')[1] ?? '', ...info }));
}

/** Làm một bước, lỗi thì ghi lại và đi tiếp. */
async function attempt(label, fn) {
  try { await fn(); } catch (e) { console.log(`STEP FAILED ${label}: ${String(e.message).split('\n')[0].slice(0, 150)}`); }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
page.on('response', (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url().slice(-60)}`); });

await page.goto(`${BASE}/`);
await page.evaluate(() => { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'ha-noi'); });
await page.goto(`${BASE}/#/deck/ha-noi`); await page.reload();
for (let i = 0; i < 4; i += 1) { await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).first().click(); await page.waitForTimeout(300); }
await page.goto(`${BASE}/#/picked`);

await attempt('lưu thành chuyến', async () => { await page.getByRole('button', { name: /Lưu \d+ địa điểm thành chuyến/ }).click({ timeout: 5000 }); });
await snap(page, 'sau-bam-luu', 1500);

await attempt('điền tên chuyến', async () => {
  const box = page.getByRole('textbox').first();
  if (await box.count()) { await box.fill('Hà Nội 3 ngày'); }
  await snap(page, 'hop-thoai-ten');
  const ok = page.getByRole('button', { name: 'Xác nhận', exact: true });
  if (await ok.count()) await ok.click({ timeout: 4000 });
  await snap(page, 'bang-ma-khoi-phuc');
  await page.getByRole('button', { name: /Để sau/ }).click({ timeout: 4000 });
});
await snap(page, 'chuyen-vua-tao', 2000);

await attempt('xếp tự động', async () => { await page.getByRole('button', { name: /^Xếp d+ nơi/ }).click({ timeout: 4000 }); });
await snap(page, 'sau-xep-tu-dong', 2500);
await attempt('ngày 1', async () => { await page.getByRole('button', { name: 'Ngày 1', exact: true }).click({ timeout: 4000 }); });
await snap(page, 'ngay-1', 1500);
await attempt('cuộn ngày 1', async () => { await page.evaluate(() => window.scrollBy(0, 600)); });
await snap(page, 'ngay-1-cuon');
await attempt('tổng quan chi phí', async () => { await page.getByRole('button', { name: 'Tổng quan', exact: true }).click({ timeout: 4000 }); await page.evaluate(() => window.scrollBy(0, 900)); });
await snap(page, 'tong-quan-chi-phi');
await attempt('xuất', async () => { await page.evaluate(() => window.scrollTo(0, 0)); await page.getByRole('button', { name: /Lưu hoặc gửi lịch trình/ }).click({ timeout: 4000 }); });
await snap(page, 'xuat-lich-trinh', 1500);
console.log('--- lỗi:', JSON.stringify([...new Set(errors)].slice(0, 10)));
await browser.close();
