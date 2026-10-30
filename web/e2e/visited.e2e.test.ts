// Đã ghé: trình duyệt thật + seed backend thật, tách khỏi bộ Hôm nay. Không chạy trong job UX cards.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { api, createOwner, loginAs } from './backend.ts';
import { sampleTripsState } from './seed.ts';

let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await server?.close();
});

/** Dựng đúng ba địa điểm, một việc và một khoảng nghỉ cùng ngày; thứ tự giờ không phụ thuộc giờ máy chạy. */
async function seedVisited() {
  const owner = await createOwner();
  const member = await createOwner();
  const day = sampleTripsState().trips[0]!['startDate'] as string;
  const made = await api('POST', '/api/trips', owner.token, { name: 'Đã ghé — kiểm thử', destination: 'ha-giang', startDate: day, endDate: day });
  assert.equal(made.status, 201);
  const tripId = (made.body?.['trip'] as { id: string }).id;
  const fields = [
    { placeId: 'cot-co-lung-cu', type: 'sightseeing', title: 'Cột cờ Lũng Cú', timeOfDay: '08:00' },
    { placeId: 'deo-ma-pi-leng', type: 'sightseeing', title: 'Đèo Mã Pì Lèng', timeOfDay: '10:00' },
    { placeId: 'song-nho-que', type: 'sightseeing', title: 'Sông Nho Quế', timeOfDay: '13:00' },
    { type: 'rest', title: 'Nghỉ giữa ngày', timeOfDay: '14:00' },
    { type: 'task', title: 'Đổ xăng kiểm thử', timeOfDay: '15:00' },
  ];
  for (const item of fields) {
    const result = await api('POST', `/api/trips/${tripId}/items`, owner.token, { ...item, day });
    assert.equal(result.status, 201, `seed ${item.title}`);
  }
  const invite = await api('POST', `/api/trips/${tripId}/invites`, owner.token, {});
  assert.equal(invite.status, 201);
  const code = (invite.body?.['invite'] as { code: string }).code;
  const joined = await api('POST', '/api/invites/join', member.token, { code, displayName: 'Bạn cùng chuyến' });
  assert.equal(joined.status < 300, true, 'seed thành viên thứ hai thành công');
  return { owner, member, tripId, day };
}

/** Đăng nhập trong vùng lưu trữ riêng, rồi giả lập ngày như bộ Hôm nay hiện có. */
async function openToday(ctx: BrowserContext, token: string, day: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.destination.v1', 'ha-giang');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}');
  });
  await loginAs(page, token);
  await page.goto(`${baseUrl}/#/today`);
  await page.getByLabel('Giả lập ngày').fill(day);
  await page.getByRole('heading', { name: /Ngày 1 ·/ }).waitFor();
  return page;
}

/** Đợi số liệu hiển thị sau lần đọc lại chuyến, không dựa vào toast hoặc sleep. */
async function progress(page: Page, visited: number): Promise<void> {
  await page.getByRole('status').filter({ hasText: `Của bạn: ${visited}/3 nơi đã ghé` }).waitFor();
}

test('Đã ghé: chuyển điểm kế tiếp, bỏ tích, độc lập từng thành viên; Nghỉ/Task không có nút Đã ghé và kết thúc đếm số thật', async () => {
  const seeded = await seedVisited();
  const options = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' };
  const ownerCtx = await browser.newContext(options);
  const memberCtx = await browser.newContext(options);
  try {
    const page = await openToday(ownerCtx, seeded.owner.token, seeded.day);
    await progress(page, 0);
    await page.locator('.today-next h3', { hasText: 'Cột cờ Lũng Cú' }).waitFor();
    for (const title of ['Nghỉ giữa ngày', 'Đổ xăng kiểm thử']) {
      const row = page.locator('li.todayrow', { hasText: title });
      assert.equal(await row.getByRole('button', { name: /đã ghé/i }).count(), 0, `${title} không có nút Đã ghé`);
    }
    assert.equal(await page.locator('li.todayrow', { hasText: 'Nghỉ giữa ngày' }).getByRole('button').count(), 0);
    const task = page.getByRole('button', { name: /Hoàn thành: Đổ xăng kiểm thử/ });
    await task.click();
    await task.and(page.locator('[aria-pressed="true"]')).waitFor();
    await progress(page, 0); // Việc hoàn thành không làm tăng tử hoặc mẫu số địa điểm.
    await page.locator('.today-next').getByRole('button', { name: 'Đánh dấu đã ghé Cột cờ Lũng Cú', exact: true }).click();
    await page.locator('.today-next h3', { hasText: 'Đèo Mã Pì Lèng' }).waitFor();
    await progress(page, 1);

    const other = await openToday(memberCtx, seeded.member.token, seeded.day);
    await progress(other, 0);
    await other.locator('.today-next h3', { hasText: 'Cột cờ Lũng Cú' }).waitFor();
    assert.equal(await other.getByRole('button', { name: /Hoàn thành: Đổ xăng kiểm thử/ }).getAttribute('aria-pressed'), 'false');
    // Khẳng định từ API đọc theo từng thành viên, tránh kết luận do UI chưa làm mới.
    const detail = await api('GET', `/api/trips/${seeded.tripId}`, seeded.member.token);
    const items = (detail.body?.['days'] as { items: { placeId: string | null; done: boolean }[] }[]).flatMap(d => d.items);
    assert.equal(items.find(i => i.placeId === 'cot-co-lung-cu')?.done, false);

    await page.getByRole('button', { name: 'Bỏ đánh dấu đã ghé Cột cờ Lũng Cú', exact: true }).click();
    await progress(page, 0);
    await page.locator('.today-next h3', { hasText: 'Cột cờ Lũng Cú' }).waitFor();
    await page.locator('.today-next').getByRole('button', { name: 'Đánh dấu đã ghé Cột cờ Lũng Cú', exact: true }).click();
    await progress(page, 1);
    const after = new Date(`${seeded.day}T12:00:00Z`);
    after.setUTCDate(after.getUTCDate() + 1);
    await page.getByLabel('Giả lập ngày').fill(after.toISOString().slice(0, 10));
    await page.getByRole('heading', { name: 'Chuyến đi đã kết thúc' }).waitFor();
    await progress(page, 1); // Thật là 1/3, không suy đoán 3/3 vì đã qua ngày về.
    await other.getByLabel('Giả lập ngày').fill(after.toISOString().slice(0, 10));
    await other.getByRole('heading', { name: 'Chuyến đi đã kết thúc' }).waitFor();
    await progress(other, 0);
  } finally {
    await ownerCtx.close();
    await memberCtx.close();
  }
});
