/** Đo production bằng Chrome: không mock API; lưu long task/frame/network để chọn tối ưu từ dữ liệu. */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
const base = 'http://127.0.0.1:8787';
const tag = process.argv.find(value => value.startsWith('--tag='))?.slice(6) ?? 'baseline';
const output = path.resolve(`.logs/performance-${tag}`);
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390, locale: 'vi-VN' });
    await context.addInitScript(() => {
      localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
      window.__wanderPerf = { tasks: [], frames: [], previous: 0, running: true };
      new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__wanderPerf.tasks.push({ start: entry.startTime, duration: entry.duration }); }).observe({ type: 'longtask', buffered: true });
      const tick = time => { const probe = window.__wanderPerf; if (probe.previous) probe.frames.push(time - probe.previous); probe.previous = time; if (probe.running) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const requests = [];
    page.on('request', request => requests.push({ url: request.url(), time: Date.now() }));
    const started = Date.now();
    await page.goto(`${base}/?intro=0#/`, { waitUntil: 'domcontentloaded' });
    await page.locator('.home-hero-card').waitFor();
    const readyMs = Date.now() - started;
    await page.waitForTimeout(2500);
    const beforeFilter = requests.length;
    const filterStart = Date.now();
    await page.getByRole('button', { name: 'Món ăn', exact: true }).first().click();
    await page.waitForTimeout(2500);
    const filterObservationMs = Date.now() - filterStart;
    const filterRequests = requests.slice(beforeFilter).filter(request => request.url.includes('/api/catalog/destinations/')).map(request => request.url);
    const pane = page.locator('#screen');
    await pane.hover();
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(1200);
    const home = await page.evaluate(() => {
      const frames = window.__wanderPerf.frames.filter(value => value < 1000).sort((a, b) => a - b);
      const glass = [...document.querySelectorAll('*')].filter(element => { const rect = element.getBoundingClientRect(); return rect.width && rect.height && getComputedStyle(element).backdropFilter !== 'none'; });
      return { longTasks: window.__wanderPerf.tasks, frameP95: frames[Math.floor(frames.length * .95)], framesOver50ms: frames.filter(value => value > 50).length, dom: document.querySelectorAll('*').length, glassLayers: glass.length, canvases: document.querySelectorAll('canvas').length, transferredBytes: performance.getEntriesByType('resource').reduce((sum, entry) => sum + entry.transferSize, 0) };
    });
    await page.screenshot({ path: path.join(output, `${width}-home.png`) });
    await page.evaluate(() => { window.__wanderPerf.tasks = []; window.__wanderPerf.frames = []; });
    await page.goto(`${base}/?intro=0#/onboard`, { waitUntil: 'domcontentloaded' });
    await page.locator('.ob-stage').waitFor();
    let maxCanvases = 0;
    for (let scene = 1; scene < 4; scene++) {
      const dot = page.locator('.ob-dots button').nth(scene);
      await dot.click();
      for (let sample = 0; sample < 8; sample++) {
        maxCanvases = Math.max(maxCanvases, await page.locator('canvas').count());
        await page.waitForTimeout(100);
      }
      await page.waitForTimeout(1000);
    }
    const onboard = await page.evaluate(() => ({ tasks: window.__wanderPerf.tasks, canvases: document.querySelectorAll('canvas').length, images: document.images.length, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
    await page.screenshot({ path: path.join(output, `${width}-onboard.png`) });
    report.push({ width, cpuThrottle: 4, homeReadyMs: readyMs, filterObservationMs, filterDetailRequests: filterRequests.length, filterRequests, home, onboard: { ...onboard, maxCanvases } });
    await context.close();
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ width, homeReadyMs: readyMs, filterDetailRequests: filterRequests.length, glassLayers: home.glassLayers, frameP95: home.frameP95, onboardMaxCanvases: maxCanvases }));
  }
} finally { await browser.close(); }
