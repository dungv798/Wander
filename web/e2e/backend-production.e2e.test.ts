import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import type { Browser } from 'playwright-core';
import { BACKEND, createOwner, loginAs } from './backend.ts';
import { waitForNativeMap } from './mapChecks.ts';

let browser: Browser;

test.before(async () => {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
    .catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => { await browser?.close(); });

/** Đọc HTML production qua Spring thật để kiểm CSP/worker/map mà Vite preview không tái hiện. */
test('backend production: CSP thật, bản đồ và API cùng origin, asset thiếu không thành HTML', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'vi-VN' });
  const violations: string[] = [];
  await context.exposeFunction('recordDeploymentCspViolation', (message: string) => { violations.push(message); });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
    document.addEventListener('securitypolicyviolation', event => {
      void (window as unknown as { recordDeploymentCspViolation: (message: string) => Promise<void> }).recordDeploymentCspViolation(
        `${event.effectiveDirective}: ${event.blockedURI}`,
      );
    });
  });
  const tileResponse = page.waitForResponse(response => {
    const url = new URL(response.url());
    return url.hostname === 'tiles.openfreemap.org' && url.pathname.endsWith('.pbf')
      && !url.pathname.includes('/fonts/') && response.ok();
  }, { timeout: 60000 }).catch((error: unknown) => error);
  try {
    const response = await page.goto(`${BACKEND}/#/`);
    assert.equal(response?.status(), 200);
    assert.ok(response?.headers()['content-security-policy']?.includes("default-src 'self'"));
    await page.locator('.nh-title h1', { hasText: 'Đà Lạt' }).waitFor();
    await page.locator('.home-map').scrollIntoViewIfNeeded();
    await waitForNativeMap(page, '.home-map .mapcard');
    assert.ok(!(await tileResponse instanceof Error), 'nền bản đồ tải được tile thật dưới CSP production');
    assert.equal(await page.locator('.tm-err, .tm-basemap-warning').count(), 0);
    assert.deepEqual(violations, []);
    const owner = await createOwner({ withCode: true });
    await loginAs(page, owner.token);
    await page.goto(`${BACKEND}/#/security`);
    await page.locator('h1, h2').first().waitFor();
    assert.equal(await page.locator('.protobox').count(), 0);
    const result = await page.evaluate(async () => {
      const privateResponse = await fetch('/api/trips');
      const asset = await fetch('/assets/deployment-missing.js');
      return {
        privateStatus: privateResponse.status,
        privateCache: privateResponse.headers.get('cache-control'),
        assetStatus: asset.status,
        assetCache: asset.headers.get('cache-control'),
      };
    });
    assert.equal(result.privateStatus, 401);
    assert.equal(result.privateCache, 'no-store');
    assert.equal(result.assetStatus, 404);
    assert.equal(result.assetCache, 'no-store');
    assert.deepEqual(violations, [], 'giữ mọi vi phạm CSP xuyên reload và navigation');
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
  }
});
