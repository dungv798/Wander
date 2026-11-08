import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { api, BACKEND, createOwner, TOKEN_KEY } from './backend.ts';
import { seedTrips, seededOf, storedTrips } from './seed.ts';

let browser: Browser;
test.before(async () => { browser = await chromium.launch({ channel: 'chrome', headless: true }); });
test.after(async () => { await browser?.close(); });

/** Bản production và backend thật, mỗi ca có danh tính/chuyến riêng; không reset CSDL review. */
async function openPlan(): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'vi-VN' });
  await context.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
  const page = await context.newPage();
  await page.goto(`${BACKEND}/?intro=0`, { waitUntil: 'domcontentloaded' });
  const seeded = await seedTrips(page);
  await page.goto(`${BACKEND}/?intro=0#/trip/${seeded.tripId}/un`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Xếp \d+ nơi$/ }).click();
  await page.locator('.plan-days-grid').waitFor();
  return { page, context };
}

/** Đợi trạng thái server thay đổi, có hạn chờ rõ ràng. */
async function remaining(page: Page, count: number) {
  const deadline = Date.now() + 10000;
  do {
    const trip = (await storedTrips(page)).trips[0]!;
    if (trip.items.filter(item => item.day === null).length === count) return trip;
    await page.waitForTimeout(100);
  } while (Date.now() < deadline);
  throw new Error(`Không đạt ${count} mục chưa xếp`);
}

/** Giữ nguyên DTO thật để so cả giờ, thời lượng, booking và thứ tự; helper storedTrips chỉ chọn một số trường. */
async function rawItems(page: Page): Promise<Record<string, unknown>[]> {
  const token = await page.evaluate(key => (JSON.parse(localStorage.getItem(key) ?? 'null') as { token: string }).token, TOKEN_KEY);
  const body = (await api('GET', `/api/trips/${seededOf(page).tripId}`, token)).body as { days: { items: Record<string, unknown>[] }[]; unscheduled: Record<string, unknown>[] };
  return [...body.days.flatMap(day => day.items), ...body.unscheduled];
}

test('gợi ý chỉ thêm mục vừa lịch, không sửa mục cũ; Undo và lưu sau reload trên backend thật', async () => {
  const { page, context } = await openPlan();
  try {
    const before = (await storedTrips(page)).trips[0]!;
    const fixed = before.items.filter(item => item.day !== null);
    const fixedRaw = (await rawItems(page)).filter(item => item['day'] !== null);
    assert.ok(fixedRaw.some(item => item['timeOfDay'] === '10:00' && item['durationMin'] === 60));
    assert.equal(await page.locator('.plan-day-card .plan-stop[data-kept="false"]').count(), 1);
    assert.equal(await page.locator('.plan-deferred .plan-stop').count(), 2);
    const apply = page.getByRole('button', { name: 'Áp dụng gợi ý', exact: true });
    await apply.click();
    await page.getByRole('dialog', { name: 'Gợi ý xếp ngày' }).waitFor({ state: 'detached' });
    const after = await remaining(page, 2);
    assert.deepEqual(after.items.filter(item => fixed.some(old => old.id === item.id)), fixed);
    assert.deepEqual((await rawItems(page)).filter(item => fixedRaw.some(old => old['id'] === item['id'])), fixedRaw);
    await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
    await remaining(page, 3);
    await page.getByRole('button', { name: /^Xếp \d+ nơi$/ }).click();
    await page.locator('.plan-days-grid').waitFor();
    await apply.click();
    await page.getByRole('dialog', { name: 'Gợi ý xếp ngày' }).waitFor({ state: 'detached' });
    await remaining(page, 2);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const reloaded = await remaining(page, 2);
    assert.deepEqual(reloaded.items.filter(item => fixed.some(old => old.id === item.id)), fixed);
    assert.deepEqual((await rawItems(page)).filter(item => fixedRaw.some(old => old['id'] === item['id'])), fixedRaw);
  } finally { await context.close(); }
});

test('lưu lỗi giữ nguyên bản nháp và ngày trên server; có thể thử lại', async () => {
  const { page, context } = await openPlan();
  try {
    const before = (await storedTrips(page)).trips[0]!.items;
    const moved = page.getByLabel('Đổi ngày cho Ruộng bậc thang Hoàng Su Phì');
    await moved.selectOption({ label: 'Ngày 3' });
    const chosenDay = await moved.inputValue();
    await page.route('**/api/trips/*/schedule', route => route.fulfill({ status: 500, json: { code: 'INTERNAL_ERROR' } }));
    const apply = page.getByRole('button', { name: 'Áp dụng gợi ý', exact: true });
    await apply.click();
    await page.waitForFunction(() => !document.querySelector<HTMLButtonElement>('.plan-preview-actions .btn:last-child')?.disabled);
    assert.equal(await page.getByRole('dialog', { name: 'Gợi ý xếp ngày' }).isVisible(), true);
    assert.equal(await moved.inputValue(), chosenDay, 'lỗi lưu không làm mất ngày người dùng chọn trong bản nháp');
    assert.deepEqual((await storedTrips(page)).trips[0]!.items, before);
    await page.unroute('**/api/trips/*/schedule');
    await apply.click();
    await page.getByRole('dialog', { name: 'Gợi ý xếp ngày' }).waitFor({ state: 'detached' });
    await remaining(page, 1);
  } finally { await context.close(); }
});

test('đề nghị xóa xuất hiện sau khi mở preview được kiểm lại trước khi gọi schedule', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  try {
    await context.addInitScript(() => localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'));
    const page = await context.newPage();
    await page.goto(`${BACKEND}/?intro=0`, { waitUntil: 'domcontentloaded' });
    const seeded = await seedTrips(page);
    let schedules = 0;
    const itemId = [...seeded.alias].find(([, alias]) => alias === 'u1')?.[0];
    assert.ok(itemId, 'fixture phải trỏ tới ID thật của mục trên backend');
    const ownerToken = await page.evaluate(key => (JSON.parse(localStorage.getItem(key) ?? 'null') as { token: string }).token, TOKEN_KEY);
    const invite = await api('POST', `/api/trips/${seeded.tripId}/invites`, ownerToken, {});
    assert.equal(invite.status, 201);
    const guest = await createOwner();
    const code = (invite.body?.['invite'] as { code: string }).code;
    assert.equal((await api('POST', '/api/invites/join', guest.token, { code, displayName: 'Bạn đi cùng' })).status, 201);
    page.on('request', request => { if (request.url().endsWith('/schedule') && request.method() === 'POST') schedules++; });
    await page.goto(`${BACKEND}/?intro=0#/trip/${seeded.tripId}/un`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Xếp \d+ nơi$/ }).click();
    await page.locator('.plan-days-grid').waitFor();
    assert.equal((await api('POST', `/api/trips/${seeded.tripId}/deletion-requests`, guest.token, { itemId, reason: 'Cần kiểm tra lại' })).status, 201);
    await page.getByRole('button', { name: 'Áp dụng gợi ý', exact: true }).click();
    const protectedRow = page.locator('.plan-deferred .plan-stop', { hasText: 'Phố cổ Đồng Văn' });
    await protectedRow.getByText('Đang chờ duyệt xóa · không tự xếp').waitFor();
    assert.equal(await protectedRow.locator('select').count(), 0);
    assert.equal(schedules, 0);
    await remaining(page, 3);
  } finally { await context.close(); }
});

test('đổi ngày tường minh cho điểm xa tính lại cảnh báo; bỏ lựa chọn vẫn giữ mục trong preview', async () => {
  const { page, context } = await openPlan();
  try {
    await page.getByLabel('Đổi ngày cho Ruộng bậc thang Hoàng Su Phì').selectOption({ label: 'Ngày 3' });
    const day = page.locator('.plan-day-card', { hasText: 'Ngày 3' });
    assert.equal(await day.getAttribute('data-overloaded'), 'true');
    await day.getByText('khá dày, nên cân nhắc thêm ngày').waitFor();
    await day.getByRole('button', { name: 'Phố cổ Đồng Văn', exact: true }).click();
    const detail = page.getByRole('dialog', { name: 'Phố cổ Đồng Văn', exact: true });
    await detail.waitFor();
    await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
    assert.equal(await day.getAttribute('data-overloaded'), 'true', 'xem chi tiết rồi quay lại vẫn giữ lựa chọn trong bản nháp');
    await page.getByLabel('Đổi ngày cho Phố cổ Đồng Văn').selectOption('');
    await page.locator('.plan-deferred .plan-stop', { hasText: 'Phố cổ Đồng Văn' }).waitFor();
    await page.getByRole('button', { name: 'Để tôi tự xếp' }).click();
    await remaining(page, 3);
  } finally { await context.close(); }
});
