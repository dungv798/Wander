// Kiểm trên backend thật (CSP thật): ảnh Unsplash hotlink có hiện được không và có vi phạm CSP nào không. Chụp Home vài điểm đến.
import path from 'node:path';
import { chromium } from 'playwright-core';
const BASE = process.argv[2] ?? 'http://localhost:8787';
const OUT = path.resolve('.tmp/walk');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
const page = await ctx.newPage();
const problems = [];
page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text().slice(0, 160)); });
page.on('requestfailed', (r) => { if (r.url().includes('unsplash')) problems.push(`requestfailed ${r.url().slice(0, 60)} ${r.failure()?.errorText}`); });
await page.goto(`${BASE}/`);
await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
const stat = async (label) => {
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => { const imgs = [...document.images].filter((i) => i.src.includes('images.unsplash.com')); return { total: imgs.length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length }; });
  console.log(label.padEnd(26), 'ảnh Unsplash trên màn:', JSON.stringify(r));
};
await page.goto(`${BASE}/#/`); await page.reload();
await stat('Home lần đầu (12 thẻ)');
await page.screenshot({ path: path.join(OUT, 'u-home-lan-dau.png') });
for (const d of ['ha-giang', 'ha-noi', 'hoi-an']) {
  await page.evaluate((id) => localStorage.setItem('wander.web.destination.v1', id), d);
  await page.goto(`${BASE}/#/`); await page.reload();
  await page.evaluate(() => window.scrollTo(0, 700));
  await stat(`Home ${d}`);
  await page.screenshot({ path: path.join(OUT, `u-home-${d}.png`) });
}
console.log('vi phạm CSP / ảnh lỗi:', JSON.stringify([...new Set(problems)]));
const csp = (await (await fetch(`${BASE}/`)).headers.get('content-security-policy')) ?? '';
console.log('img-src thực tế:', (csp.match(/img-src[^;]*/) ?? ['(không có)'])[0]);
await browser.close();
