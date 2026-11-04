// Chụp ảnh thật phục vụ đợt hoàn thiện 02/11/2026: node scripts/polish-shots.ts --set=after [--only=home,trip-ov] [--width=390]
// Dùng máy chủ Vite đang chạy (mặc định http://127.0.0.1:5180) và backend thật ở 8787. Ảnh: .logs/polish/<set>/<màn>--<rộng>.png
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import type { Page } from 'playwright-core';
import { seedTrips, seededOf } from '../e2e/seed.ts';

const arg = (name: string, dflt: string): string => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=')[1] ?? dflt;
const URL = arg('url', 'http://127.0.0.1:5180');
const SET = arg('set', 'after');
const WIDTH = Number(arg('width', '390'));
const HEIGHT = Number(arg('height', '844'));
const ONLY = arg('only', '').split(',').filter(Boolean);
const OUT = path.resolve(import.meta.dirname, `../../.logs/polish/${SET}`);
const TALL = 2600;
const SETTLE_MS = 1200;

interface Shot { readonly id: string; readonly tall?: boolean; readonly go: (p: Page) => Promise<void> }

/** Bỏ qua giới thiệu để vào thẳng ứng dụng. */
async function skipOnboarding(p: Page, destination?: string): Promise<void> {
  await p.context().addInitScript((dest) => {
    try { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); if (dest) localStorage.setItem('wander.web.destination.v1', dest); } catch { /* bỏ qua */ }
  }, destination);
  await p.goto(`${URL}/#/`);
}

/** Dựng chuyến mẫu và mở đúng tab (`ov` hoặc số ngày). */
async function openTrip(p: Page, tab: string): Promise<void> {
  await skipOnboarding(p);
  await seedTrips(p);
  await p.goto(`${URL}/#/trip/${seededOf(p).tripId}/${tab}`);
  await p.waitForSelector('.sheet-scroll');
}

const SHOTS: readonly Shot[] = [
  { id: 'home-fresh', go: async (p) => { await skipOnboarding(p); await p.goto(`${URL}/#/`); } },
  { id: 'home-selected', go: async (p) => { await skipOnboarding(p, 'da-lat'); } },
  { id: 'search-places', go: async (p) => { await skipOnboarding(p, 'da-lat'); await p.goto(URL + '/#/destinations/places'); } },
  { id: 'search-places-nocity', go: async (p) => { await skipOnboarding(p); await p.goto(URL + '/#/destinations/places'); } },
  { id: 'home-chosen', go: async (p) => { await skipOnboarding(p); await p.goto(`${URL}/#/dest/da-lat`); } },
  { id: 'trip-ov', tall: true, go: async (p) => openTrip(p, 'ov') },
  { id: 'trip-day1', tall: true, go: async (p) => openTrip(p, '1') },
  { id: 'cost-detail', go: async (p) => { await openTrip(p, 'ov'); await p.getByRole('button', { name: 'Xem chi tiết' }).click(); } },
  { id: 'cost-add', go: async (p) => { await openTrip(p, 'ov'); await p.getByRole('button', { name: 'Thêm khoản' }).click(); } },
  { id: 'addmany', go: async (p) => { await openTrip(p, '1'); await p.getByRole('button', { name: 'Thêm nhiều nơi' }).first().click(); await p.locator('.add-many-list label').first().click(); } },
  { id: 'plan', go: async (p) => { await openTrip(p, 'ov'); await p.getByRole('button', { name: /^Xếp \d+ nơi/ }).click(); } },
];

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let failed = 0;
try {
  for (const s of SHOTS.filter((x) => ONLY.length === 0 || ONLY.includes(x.id))) {
    const ctx = await browser.newContext({ viewport: { width: WIDTH, height: s.tall ? TALL : HEIGHT }, deviceScaleFactor: 2, isMobile: WIDTH < 700, hasTouch: WIDTH < 700, locale: 'vi-VN' });
    const page = await ctx.newPage();
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
    try {
      await s.go(page);
      await page.waitForTimeout(SETTLE_MS);
      await page.screenshot({ path: path.join(OUT, `${s.id}--${WIDTH}.png`) });
      console.log(`ok   ${s.id}${errors.length ? ` (lỗi console: ${errors.slice(0, 2).join(' | ')})` : ''}`);
    } catch (e) {
      failed += 1;
      console.log(`FAIL ${s.id}: ${(e as Error).message.split('\n')[0]}`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
