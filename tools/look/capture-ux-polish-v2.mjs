import fs from 'node:fs';
import path from 'node:path';
import { createServer } from '../../web/node_modules/vite/dist/node/index.js';
import { chromium } from '../../node_modules/playwright-core/index.mjs';
import { mockApi, readCatalog } from './capture-fixtures.mjs';
import assert from 'node:assert/strict';
const phase = process.argv[2] ?? 'before';
const out = path.resolve('.logs/ux-polish/v2', phase);
fs.mkdirSync(out, { recursive: true });
const server = await createServer({ root: path.resolve('web'), server: { port: 0 }, logLevel: 'error' });
const result = { phase, errors: [], screens: [], checks: [] };
let browser;
try {
 await server.listen();
 browser = await chromium.launch({ channel: 'chrome', headless: true });
 for (const [name, hash] of Object.entries({ home: '/', unselected: '/', detail: '/deck/ha-giang', settings: '/settings', security: '/security', recover: '/recover', join: '/join/' + 'a'.repeat(43), expired: '/expired' })) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ctx.addInitScript(name => {
   if (name !== 'unselected') localStorage.setItem('wander.web.destination.v1', 'da-lat');
   localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  }, name);
  const page = await ctx.newPage();
  page.on('pageerror', e => result.errors.push({ name, message: e.message }));
  await mockApi(page, readCatalog());
  await page.route('**/api/preferences', route => route.fulfill({ json: { interests: [], styles: [], pace: null, budgetK: null } }));
  await page.route('**/api/invites/**', route => route.fulfill({ status: 404, json: { code: 'INVALID_INVITE' } }));
  await page.goto(`${server.resolvedUrls.local[0]}?intro=0#${hash}`);
  if (name === 'detail' && phase === 'after') {
   await page.evaluate(() => location.hash = '#/dest/ha-giang');
   await page.getByRole('button', { name: 'Bắt đầu quẹt', exact: true }).click();
   await page.locator('.card.front').waitFor();
  }
  await page.waitForTimeout(700);
  if (name === 'detail') { await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click(); await page.getByRole('dialog').waitFor(); }
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => { i.loading = 'eager'; return i.decode().catch(() => {}); })); });
  await page.screenshot({ path: path.join(out, `${name}.png`) });
  result.screens.push({ name, ...await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, scrollHeight: document.querySelector('#screen').scrollHeight })) });
  if (name === 'detail') {
   for (const close of ['Escape', 'close', 'back']) {
    if (close !== 'Escape') { await page.getByRole('button', { name: 'Xem chi tiết', exact: true }).click(); await page.getByRole('dialog').waitFor(); }
    if (close === 'Escape') await page.keyboard.press('Escape');
    if (close === 'close') await page.getByRole('dialog').getByRole('button', { name: 'Đóng', exact: true }).click();
    if (close === 'back') await page.evaluate(() => history.back());
    await page.waitForTimeout(250);
    const check = { close, ...await page.evaluate(() => ({ hash: location.hash, dialogs: document.querySelectorAll('[role="dialog"]').length, focus: document.activeElement?.getAttribute('aria-label') })) };
    result.checks.push(check);
    if (phase === 'after') { assert.equal(check.hash, '#/deck/ha-giang'); assert.equal(check.dialogs, 0); assert.equal(check.focus, 'Xem chi tiết'); }
    if (phase === 'before') break;
   }
   if (phase === 'after') {
    await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await page.waitForTimeout(250);
    const hash = await page.evaluate(() => location.hash);
    assert.equal(hash, '#/dest/ha-giang');
    result.checks.push({ deckBackToOrigin: hash });
   }
  }
  if (name === 'settings' && phase === 'after') {
   await page.getByRole('button', { name: /Bảo mật/ }).click();
   await page.getByRole('heading', { name: 'Bảo mật', exact: true }).waitFor();
   await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
   await page.waitForTimeout(200);
   const source = await page.evaluate(() => location.hash);
   assert.equal(source, '#/settings');
   result.checks.push({ settingsSecurityBack: source });
   await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
   await page.waitForTimeout(200);
   const fallback = await page.evaluate(() => location.hash);
   assert.equal(fallback, '#/');
   result.checks.push({ directSettingsBack: fallback });
  }
  if (name === 'security' && phase === 'after') {
   await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
   await page.waitForTimeout(200);
   const hash = await page.evaluate(() => location.hash);
   assert.equal(hash, '#/'); result.checks.push({ directSecurityBack: hash });
  }
  await ctx.close();
 }
 assert.deepEqual(result.errors, []);
 assert.ok(result.screens.every(screen => !screen.overflow));
} finally {
 fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(result, null, 2));
 await browser?.close(); await server.close();
}
console.log(JSON.stringify(result));
