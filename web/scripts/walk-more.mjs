// Đi thêm các luồng phụ như người dùng: chi tiết địa điểm, tìm kiếm, nhập chi phí. Chụp vào .tmp/walk.
import path from 'node:path';
import { chromium } from 'playwright-core';
const BASE = 'http://localhost:8787';
const OUT = path.resolve('.tmp/walk');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 100)));
const shot = async (n, wait = 1200) => { await page.waitForTimeout(wait); await page.screenshot({ path: path.join(OUT, `m-${n}.png`) }); };
const attempt = async (label, fn) => { try { await fn(); } catch (e) { console.log(`FAILED ${label}: ${String(e.message).split('\n')[0].slice(0, 120)}`); } };

await page.goto(`${BASE}/`);
await page.evaluate(() => { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'ha-noi'); });
await page.goto(`${BASE}/#/deck/ha-noi`); await page.reload();
await attempt('chi tiết', async () => { await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click({ timeout: 4000 }); });
await shot('1-chi-tiet-dia-diem');
await attempt('cuộn chi tiết', async () => { await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollHeight > e.clientHeight + 50 && getComputedStyle(e).overflowY !== 'visible') e.scrollTop = 700; }); });
await shot('2-chi-tiet-cuon', 600);
await page.keyboard.press('Escape');
await attempt('tìm kiếm', async () => {
  await page.goto(`${BASE}/#/`); await page.waitForTimeout(800);
  await page.getByRole('button', { name: /Tìm địa điểm tại Hà Nội/ }).first().click({ timeout: 4000 });
  await page.getByRole('searchbox').fill('cafe');
});
await shot('3-tim-kiem-cafe');
await attempt('tìm không dấu', async () => { await page.getByRole('searchbox').fill('pho co'); });
await shot('4-tim-pho-co', 900);
console.log('lỗi trang:', JSON.stringify(errors));
await browser.close();
