// Chụp từng khối của contact sheet ảnh ứng viên: node scripts/shot-sheet.mjs <dest> [chỉ-số-khối ...]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const [dest, ...picks] = process.argv.slice(2);
const dir = path.resolve(import.meta.dirname, '../../docs/research/photo-candidates');
const out = path.resolve(import.meta.dirname, '../../.logs/polish/sheets');
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
await page.goto(new URL(`file:///${path.join(dir, `${dest}.html`)}`).href);
await page.waitForFunction(() => [...document.images].every((i) => i.complete), undefined, { timeout: 60000 }).catch(() => {});
const sections = await page.locator('section').all();
for (const [i, s] of sections.entries()) {
  if (picks.length && !picks.includes(String(i))) continue;
  await s.screenshot({ path: path.join(out, `${dest}-${i}.png`) });
  console.log(`${dest}-${i}.png`);
}
await browser.close();
