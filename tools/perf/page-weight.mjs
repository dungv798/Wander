#!/usr/bin/env node
/**
 * Measures how many bytes a real browser transfers to show one route of the app (default: the Da Lat destination page).
 *
 * Chrome/Edge (via playwright-core) loads the page on a 390x844 mobile viewport with an empty cache, scrolls the list so lazy images
 * load, and sums `encodedDataLength` (bytes on the wire including headers) from the DevTools Network domain, per resource type.
 *
 * Usage: node tools/perf/page-weight.mjs [--base http://127.0.0.1:8787] [--route "#/dest/da-lat"] [--runs 3]
 * Prints one JSON object (median over the runs).
 */
import { chromium } from 'playwright-core';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const BASE = option('--base', 'http://127.0.0.1:8787');
const ROUTE = option('--route', '#/dest/da-lat');
const RUNS = Number(option('--runs', '3'));
const VIEWPORT = { width: 390, height: 844 };
const SCROLL_STEPS = 14;
const SCROLL_STEP_PX = 600;
const SETTLE_MS = 1500;

/** Opens the page once and returns bytes/requests per resource type. */
async function measureOnce(browser) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, locale: 'vi-VN' });
  await context.addInitScript(() => {
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
    localStorage.setItem('wander.web.destination.v1', 'da-lat');
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const types = new Map();
  const pending = new Map();
  cdp.on('Network.requestWillBeSent', e => pending.set(e.requestId, e.type ?? 'Other'));
  cdp.on('Network.loadingFinished', e => {
    const type = pending.get(e.requestId) ?? 'Other';
    const entry = types.get(type) ?? { requests: 0, bytes: 0 };
    entry.requests += 1;
    entry.bytes += e.encodedDataLength;
    types.set(type, entry);
  });
  await page.goto(`${BASE}/${ROUTE}`, { waitUntil: 'networkidle' });
  for (let i = 0; i < SCROLL_STEPS; i += 1) {
    await page.mouse.move(VIEWPORT.width / 2, VIEWPORT.height / 2);
    await page.mouse.wheel(0, SCROLL_STEP_PX);
    await page.waitForTimeout(250);
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(SETTLE_MS);
  await context.close();
  const total = [...types.values()].reduce((sum, t) => sum + t.bytes, 0);
  return { total, byType: Object.fromEntries([...types].map(([k, v]) => [k, v])) };
}

/** Median of a list of numbers. */
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
try {
  const runs = [];
  for (let i = 0; i < RUNS; i += 1) runs.push(await measureOnce(browser));
  const image = runs.map(r => r.byType.Image?.bytes ?? 0);
  const imageRequests = runs.map(r => r.byType.Image?.requests ?? 0);
  console.log(JSON.stringify({
    base: BASE, route: ROUTE, viewport: VIEWPORT, runs: RUNS,
    totalBytesMedian: median(runs.map(r => r.total)),
    imageBytesMedian: median(image), imageRequestsMedian: median(imageRequests),
    perRunTotal: runs.map(r => r.total), perRunImageBytes: image,
  }));
} finally {
  await browser.close();
}
