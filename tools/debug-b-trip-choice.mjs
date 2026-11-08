import { createRequire } from 'node:module';
import { seedTrips } from '../web/e2e/seed.ts';

const { chromium } = createRequire(new URL('../web/package.json', import.meta.url))('playwright-core');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  await seedTrips(page);
  await page.goto('http://127.0.0.1:5173/#/dest/ha-giang');
  await page.locator('.pr-photo').first().click();
  await page.getByRole('button', { name: 'Chọn cho chuyến', exact: true }).click();
  const form = page.getByRole('dialog').last();
  await form.getByRole('radio', { name: /Thêm vào chuyến đi có sẵn/ }).click();
  console.log(JSON.stringify(await form.locator('select').evaluateAll(elements => elements.map(element => ({ labels: [...element.labels].map(label => label.textContent), options: element.options.length })))));
  console.log('exactLabelMatches', await form.getByLabel('Chọn chuyến đi', { exact: true }).count());
  await page.screenshot({ path: '.logs/b-parity-trip-choice-debug.png' });
} finally { await browser.close(); }
