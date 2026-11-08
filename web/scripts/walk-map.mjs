// Chụp lại màn Đã chọn sau khi bản đồ ổn định (chờ lâu hơn) để phân biệt "chưa tải xong" với lỗi thật.
import path from 'node:path';
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:8787';
const OUT = path.resolve(process.argv[3] ?? '.tmp/walk');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
const page = await ctx.newPage();
const bad = [];
page.on('requestfailed', (r) => bad.push(`FAILED ${r.url().slice(0, 80)} ${r.failure()?.errorText}`));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) bad.push(`${m.type()}: ${m.text().slice(0, 140)}`); });
await page.goto(`${BASE}/`);
await page.evaluate(() => { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'ha-noi'); });
await page.goto(`${BASE}/#/deck/ha-noi`); await page.reload();
for (let i = 0; i < 3; i += 1) { await page.getByRole('button', { name: 'Chọn nơi này', exact: true }).first().click(); await page.waitForTimeout(300); }
await page.goto(`${BASE}/#/picked`);
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(OUT, 'map-da-chon-6s.png') });
console.log(bad.slice(0, 10).join('\n') || 'không có lỗi mạng/console');
await browser.close();
