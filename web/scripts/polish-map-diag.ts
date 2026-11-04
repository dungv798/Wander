// Chẩn đoán bản đồ: node scripts/polish-map-diag.ts [--url=http://127.0.0.1:5180] [--hash=/destinations] [--wait=20000]
// In trạng thái data-ready, số canvas, WebGL, lỗi console và các yêu cầu mạng thất bại/chậm.
import { chromium } from 'playwright-core';

const arg = (name: string, dflt: string): string => (process.argv.find((a) => a.startsWith(`--${name}=`)) ?? `--${name}=${dflt}`).split('=').slice(1).join('=') || dflt;
const URL = arg('url', 'http://127.0.0.1:5180');
const HASH = arg('hash', '/destinations');
const WAIT = Number(arg('wait', '20000'));
const BLOCK = arg('block', 'none');
const SHOT = arg('shot', '');

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
await ctx.addInitScript(() => { try { localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); } catch { /* bỏ qua */ } });
const page = await ctx.newPage();
if (BLOCK === 'abort') await page.route(/openfreemap/, (route) => route.abort());
if (BLOCK === 'hang') await page.route(/openfreemap/, () => new Promise(() => {}));
const t0 = Date.now();
const log = (m: string): void => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log(`console.${m.type()}: ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => log(`pageerror: ${e.message.slice(0, 200)}`));
page.on('requestfailed', (r) => log(`requestfailed: ${r.url().slice(0, 120)} ${r.failure()?.errorText ?? ''}`));
page.on('response', (r) => { if (/openfreemap|maplibre|tiles|\.pbf|\.mjs/.test(r.url())) log(`${r.status()} ${r.url().slice(0, 110)}`); });
await page.goto(`${URL}/#${HASH}`);
const gl = await page.evaluate(() => { const c = document.createElement('canvas'); return Boolean(c.getContext('webgl2') ?? c.getContext('webgl')); });
log(`WebGL khả dụng: ${gl}`);
for (let i = 0; i < Math.ceil(WAIT / 2000); i += 1) {
  await page.waitForTimeout(2000);
  const state = await page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('.tmroot');
    return el ? `ready=${el.dataset['ready']} canvas=${el.querySelectorAll('canvas').length} err=${Boolean(el.querySelector('.tm-err'))} zoom=${el.dataset['zoom'] ?? '-'}` : 'không có .tmroot';
  });
  log(state);
}
if (SHOT) await page.screenshot({ path: SHOT });
await browser.close();
