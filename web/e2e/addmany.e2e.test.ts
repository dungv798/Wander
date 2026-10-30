// Backend thật; mô phỏng lỗi phản hồi bằng interception. Không tự chạy từ gói triển khai.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';
const DAY2 = '2026-11-02';
test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});
test.after(async () => { await browser?.close(); await server?.close(); });

/** Tạo chuyến ba ngày rỗng; mở tờ chọn từ ngày 2. */
async function seed(page: Page): Promise<{ id: string; token: string }> {
  const owner = await createOwner();
  const created = await api('POST', '/api/trips', owner.token, { name: 'Chọn nhiều nơi', destination: 'ha-giang', startDate: '2026-11-01', endDate: '2026-11-03' });
  assert.equal(created.status, 201);
  const id = (created.body?.['trip'] as { id: string }).id;
  await page.goto(`${baseUrl}/#/trip/${id}/2`);
  await loginAs(page, owner.token);
  await page.getByRole('button', { name: 'Thêm nhiều nơi', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: 'Thêm nhiều nơi', exact: true });
  await sheet.waitFor();
  const trail: string[] = [];
  await sheet.getByRole('checkbox').nth(2).waitFor(); // .all() không chờ: phải đợi danh sách địa điểm hiện đủ
  for (const box of (await sheet.getByRole('checkbox').all()).slice(0, 3)) {
    await box.check();
    trail.push(await sheet.getByRole('button', { name: /^Thêm \d+ nơi vào/ }).innerText());
  }
  assert.deepEqual(trail.map(label => label.match(/\d+/)?.[0]), ['1', '2', '3'], `mỗi lần tích số nơi phải tăng, thực tế: ${JSON.stringify(trail)}`);
  const labelNow = await sheet.getByRole('button', { name: /^Thêm \d+ nơi vào/ }).innerText();
  assert.match(labelNow, /^Thêm 3 nơi vào/, `sau khi tích 3 ô nút phải ghi 3 nơi, đang là: ${labelNow}`);
  await page.waitForTimeout(3000);
  const labelLater = await sheet.getByRole('button', { name: /^Thêm \d+ nơi vào/ }).innerText();
  assert.match(labelLater, /^Thêm 3 nơi vào/, `lựa chọn bị mất sau 3 giây: ${labelLater}`);
  assert.equal(await page.locator('.irow').count(), 0); // Chưa xác nhận thì chưa thêm.
  assert.equal(await sheet.getByRole('combobox').inputValue(), DAY2);
  return { id, token: owner.token };
}

/** Bấm nút xác nhận trong tờ; thất bại thì in tên các nút trong hộp thoại để biết nút thật sự hiện ra. */
async function submitThree(page: Page): Promise<void> {
  try {
    await page.getByRole('dialog').getByRole('button', { name: 'Thêm 3 nơi vào Ngày 2', exact: true }).click({ timeout: 10000 });
  } catch (error) {
    const names = await page.getByRole('dialog').getByRole('button').allInnerTexts().catch(() => ['không đọc được']);
    throw new Error(`Không thấy nút xác nhận; các nút trong hộp thoại: ${JSON.stringify(names)}`, { cause: error });
  }
}

/** Đọc toàn bộ mục từ hợp đồng chi tiết để kiểm ngày và placeId, không chỉ đếm dòng đang nhìn. */
async function itemsOf(id: string, token: string): Promise<{ day: string | null; placeId: string | null }[]> {
  const result = await api('GET', `/api/trips/${id}`, token);
  assert.equal(result.status, 200);
  const days = result.body?.['days'] as { items: { day: string | null; placeId: string | null }[] }[];
  return [...days.flatMap(day => day.items), ...(result.body?.['unscheduled'] as { day: string | null; placeId: string | null }[])];
}

test('chọn 3 nơi → Ngày 2; chạm ngoài vẫn giữ Hoàn tác; hoàn tác bỏ cả ba', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    const { id, token } = await seed(page);
    await submitThree(page);
    await page.waitForFunction(() => document.querySelectorAll('.irow').length === 3);
    const items = await itemsOf(id, token);
    assert.equal(items.length, 3);
    assert.ok(items.every(item => item.day === DAY2));
    assert.equal(new Set(items.map(item => item.placeId)).size, 3);
    await page.locator('.dayhead h2').click();
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.irow').length === 0);
    assert.deepEqual(await itemsOf(id, token), []);
  } finally { await context.close(); }
});

test('máy chủ đã thêm nhưng phản hồi lỗi: thử lại bỏ nơi đã có, ba nơi đều đúng Ngày 2 và không trùng', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    const { id, token } = await seed(page);
    let posts = 0;
    await page.route(`**/api/trips/${id}/items`, async route => {
      if (route.request().method() !== 'POST') return route.continue();
      posts++;
      if (posts === 2) {
        await route.fetch(); // Máy chủ đã ghi, nhưng máy khách không nhận được kết quả thành công.
        return route.fulfill({ status: 503, json: { code: 'INTERNAL' } });
      }
      return route.continue();
    });
    await submitThree(page);
    await page.getByRole('alert').waitFor();
    assert.equal((await itemsOf(id, token)).length, 2);
    await page.getByRole('button', { name: 'Thêm 1 nơi vào Ngày 2', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.irow').length === 3);
    const items = await itemsOf(id, token);
    assert.equal(posts, 3);
    assert.equal(items.length, 3);
    assert.equal(new Set(items.map(item => item.placeId)).size, 3);
    assert.ok(items.every(item => item.day === DAY2));
    await page.getByRole('button', { name: 'Thêm nhiều nơi', exact: true }).click();
    assert.equal(await page.getByRole('dialog').getByRole('checkbox', { checked: true }).count(), 0);
  } finally { await context.close(); }
});
