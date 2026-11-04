// Chụp ảnh kiểm ảnh/placeholder: node scripts/photo-shots.ts (cần Vite 5180 + backend 8787). Ảnh: .logs/polish/photos/
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const URL = 'http://127.0.0.1:5180';
const OUT = path.resolve(import.meta.dirname, '../../.logs/polish/photos');
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN' });
await ctx.addInitScript(() => { try { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); localStorage.setItem('wander.web.destination.v1', 'hoi-an'); } catch { /* bỏ qua */ } });
const page = await ctx.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${URL}/#/dest/hoi-an`);
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(OUT, 'dest-hoi-an.png') });
// Chi tiết nơi chưa có ảnh: mở từ tìm kiếm địa điểm
await page.goto(`${URL}/#/destinations/places`);
await page.getByRole('searchbox').fill('Phùng Hưng');
await page.locator('.destination-picker-list button').first().click();
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT, 'place-no-photo.png') });
await page.keyboard.press('Escape');
// Thẻ quẹt với nơi có ảnh mới
await page.goto(`${URL}/#/deck/hoi-an`);
await page.waitForTimeout(3000);
await page.screenshot({ path: path.join(OUT, 'deck-hoi-an.png') });
console.log('lỗi console:', errors.slice(0, 3).join(' | ') || 'không');
await browser.close();
