import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const { chromium } = createRequire(new URL('../web/package.json', import.meta.url))('playwright-core');

const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'docs/design/liquid-review-2026-11-05/app-b-reference');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1, isMobile: width === 390, hasTouch: width === 390, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:5190/panorama.html#destination/ha-giang');
      await page.waitForFunction(() => window.studioDebug?.().mapReady);
      await page.locator('[data-w-view="ha-giang|cot-co-lung-cu"]').first().click();
      await page.locator('[data-l-choose]').click();
      await page.locator('.brand-gallery-close').click();
      await page.evaluate(() => { location.hash = 'picked'; });
      await page.locator('[data-w-create]').waitFor();
      await page.screenshot({ path: path.join(out, `picked-${width}.png`) });
      await page.locator('[data-w-create]').click();
      await page.locator('[data-w-confirm-create]').waitFor();
      await page.screenshot({ path: path.join(out, `create-${width}.png`) });
      await page.locator('[data-w-confirm-create]').click();
      await page.locator('#main').getByRole('button', { name: 'Chi phí', exact: true }).click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `cost-${width}.png`) });
      console.log(`B original: picked/create/cost @${width}`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
