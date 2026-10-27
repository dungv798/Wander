// Thử luồng người dùng bằng trình duyệt thật (playwright). Mỗi luồng là một tệp trong docs/ux/tools/flow-defs/:
//   export default { id: 'F3', title: '...', size: 390, run: async ({ page, url, assert, newPage }) => { ... } }
//   node docs/ux/tools/flows.mjs [--only=F3,F4]
// Luồng đạt khi không ném lỗi và không có lỗi console/trang.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { ROOT, startServer } from './serve.mjs';

const only = (process.argv.find((a) => a.startsWith('--only=')) ?? '--only=').split('=')[1].split(',').filter(Boolean);
const dir = path.join(ROOT, 'docs/ux/tools/flow-defs');
const defs = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.mjs')).sort()) defs.push((await import(pathToFileURL(path.join(dir, f)).href)).default);
const chosen = defs.filter((d) => only.length === 0 || only.includes(d.id));
const { url, close } = await startServer(0);
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
let failed = 0;
try {
  for (const d of chosen) {
    const size = d.size ?? 390;
    const errors = [];
    const contexts = [];
    const newPage = async (opts = {}) => {
      const w = opts.size ?? size;
      const ctx = await browser.newContext({ viewport: w === 390 ? { width: 390, height: 844 } : { width: w, height: 800 }, isMobile: w === 390, hasTouch: w === 390, locale: 'vi-VN', colorScheme: opts.scheme ?? 'light', reducedMotion: opts.reducedMotion ? 'reduce' : 'no-preference' });
      contexts.push(ctx);
      await ctx.addInitScript(() => { window.__WANDER_NO_VT = true; });   // kiểm thử đọc DOM ngay sau thao tác nên tắt chuyển cảnh bất đồng bộ
      if ((opts.scheme ?? 'light') === 'dark') await ctx.addInitScript(() => { window.__WANDER_THEME = 'system'; });
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('console', (m) => m.type() === 'error' && !(opts.ignoreConsole && opts.ignoreConsole.test(m.text())) && errors.push(m.text()));   // ignoreConsole: chỉ cho trang cố tình làm hỏng mạng
      return p;
    };
    const t0 = Date.now();
    try {
      const page = await newPage();
      await d.run({ page, url, assert, newPage });
      if (errors.length) throw new Error('Lỗi console/trang: ' + errors.join(' | ').slice(0, 300));
      console.log(`✔ ${d.id} ${d.title} (${Date.now() - t0} ms)`);
    } catch (e) {
      failed++;
      console.log(`✖ ${d.id} ${d.title}\n   ${String(e.message).split('\n').slice(0, 3).join('\n   ')}`);
    } finally {
      for (const c of contexts) await c.close();
    }
  }
} finally {
  await browser.close();
  await close();
}
console.log(`${chosen.length - failed}/${chosen.length} luồng đạt`);
process.exit(failed ? 1 : 0);
