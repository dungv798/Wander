import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mockJourney, seed } from '../../tools/video/journey-fixtures.mjs';

/** Các ca độc lập dùng Chrome và catalog cục bộ, không cần backend hay DB dùng chung. */
for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`hero video: reducedMotion=${reducedMotion}`, async () => {
    const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), server: { port: 0 }, logLevel: 'error' });
    let browser;
    try {
      await server.listen();
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion });
      await seed(context);
      const page = await context.newPage();
      await mockJourney(page);
      await page.goto(`${server.resolvedUrls!.local[0]}?intro=0&hero=video#/`);
      await page.locator('.home-hero h1').waitFor();
      const video = page.locator('.home-hero video');
      await page.waitForTimeout(300);
      assert.equal(await video.count(), 0, 'chỉ tải sau tương tác');
      await page.keyboard.press('Shift');
      if (reducedMotion === 'reduce') {
        await page.waitForTimeout(1000);
        assert.equal(await video.count(), 0);
        assert.equal(await page.locator('.home-hero img.is-active').isVisible(), true);
      } else {
        await video.waitFor();
        await page.waitForFunction(() => !document.querySelector<HTMLVideoElement>('.home-hero video')!.paused);
        const layout = await page.evaluate(() => ({
          videoBottom: document.querySelector('video')!.getBoundingClientRect().bottom,
          contentTop: document.querySelector('.home-hero-content')!.getBoundingClientRect().top,
          searchTop: document.querySelector('.home-hero .search')!.getBoundingClientRect().top,
        }));
        assert.ok(layout.contentTop >= layout.videoBottom, 'chữ nằm dưới video');
        assert.ok(layout.searchTop >= layout.videoBottom, 'tìm kiếm nằm dưới video');
        const state = await video.evaluate(el => {
          const v = el as HTMLVideoElement;
          return { src: v.currentSrc || v.src, muted: v.muted, loop: v.loop, poster: v.poster, inline: v.playsInline, preload: v.preload };
        });
        assert.match(state.src, /\/video\/journey\.webm$/u);
        assert.equal((await page.request.get(state.src)).ok(), true);
        assert.equal(state.muted, true); assert.equal(state.loop, true); assert.equal(state.inline, true);
        assert.equal(state.preload, 'none'); assert.match(state.poster, /journey-poster\.jpg$/u);
        assert.equal((await page.request.get(state.poster)).ok(), true);
        await page.getByRole('button', { name: 'Tạm dừng video nền', exact: true }).click();
        assert.equal(await video.evaluate(el => (el as HTMLVideoElement).paused), true);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await video.waitFor({ state: 'detached' });
      }
      await context.close();
    } finally { await browser?.close(); await server.close(); }
  });
}
