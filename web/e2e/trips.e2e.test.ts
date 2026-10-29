// Kiểm thử đầu-cuối của tính năng Chuyến đi (pha FE, API giả) trên trình duyệt thật, khung nhìn điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { TOKEN_KEY, api } from './backend.ts';
import { seedTrips, seededOf, storedTrips } from './seed.ts';

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

/** Ngữ cảnh điện thoại 390×844 và danh sách lỗi console/trang. */
async function phone(): Promise<{ ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  const errors: string[] = [];
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  });
  return { ctx, errors };
}

/** Trang sạch (xóa lưu trữ), tùy chọn dựng chuyến mẫu qua API thật (mã "mau-ha-giang" trong địa chỉ được đổi thành mã máy chủ cấp), rồi tới địa chỉ hash. */
async function open(ctx: BrowserContext, hash: string, seed = false): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.destination.v1', 'ha-giang');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); // bỏ qua giới thiệu lần đầu (có test riêng)
  });
  await page.reload(); // kho "đã xem giới thiệu" đọc lúc khởi tạo nên phải nạp lại
  const seeded = seed ? await seedTrips(page) : null;
  await page.goto(`${baseUrl}/${seeded ? hash.replace('mau-ha-giang', seeded.tripId) : hash}`);
  return page;
}

test('tạo chuyến trống từ trang điểm đến: có trong danh sách và còn sau khi tải lại', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).last().click();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.thead h1').waitFor();
  assert.equal(await page.locator('.thead h1').textContent(), 'Hà Giang');
  await page.goto(`${baseUrl}/#/trips`);
  await page.locator('.tcard h3', { hasText: 'Hà Giang' }).waitFor();
  await page.reload();
  await page.locator('.tcard').waitFor();
  assert.equal(await page.locator('.tcard').count(), 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('lưu các nơi đã chọn thành chuyến: nơi đó nằm ở "Chưa có ngày" và bị gỡ khỏi "Đã chọn"', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (2)' }).waitFor();
  await page.getByRole('button', { name: 'Xem đã chọn (2)' }).click();
  await page.getByRole('button', { name: /Lưu 2 địa điểm thành chuyến đi/ }).click();
  const dialog = page.getByRole('dialog');
  assert.equal(await dialog.getByRole('group', { name: /Phong cách/ }).isVisible(), false);
  await dialog.getByText('Gợi ý cuối tuần tới', { exact: true }).waitFor();
  const start = await dialog.getByLabel(/^Ngày đi/).inputValue();
  const end = await dialog.getByLabel(/^Ngày về/).inputValue();
  await dialog.getByText('Tuỳ chọn thêm', { exact: true }).click();
  assert.equal(await dialog.getByRole('group', { name: /Phong cách/ }).isVisible(), true);
  await dialog.getByText('Tuỳ chọn thêm', { exact: true }).click();
  for (const height of [844, 500]) {
    await page.setViewportSize({ width: 390, height });
    const cta = dialog.getByRole('button', { name: 'Xác nhận', exact: true });
    await page.waitForFunction(() => (document.querySelector('[role="dialog"]')?.getBoundingClientRect().bottom ?? Infinity) <= innerHeight);
    const box = await cta.boundingBox();
    assert.ok(box && box.y >= 0 && box.y + box.height <= height);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.getByRole('button', { name: 'Tạo từng bước' }).click();
  await dialog.getByRole('button', { name: 'Tiếp', exact: true }).click();
  assert.equal(await dialog.getByLabel(/^Ngày đi/).inputValue(), start);
  assert.equal(await dialog.getByLabel(/^Ngày về/).inputValue(), end);
  await dialog.getByRole('button', { name: 'Quay lại', exact: true }).click();
  await dialog.getByRole('button', { name: 'Quay lại', exact: true }).click();
  assert.equal(await dialog.getByLabel(/^Ngày đi/).inputValue(), start);
  await dialog.getByRole('button', { name: 'Tạo từng bước' }).click();
  for (let step = 0; step < 5; step += 1) await dialog.getByRole('button', { name: 'Tiếp', exact: true }).click();
  await dialog.getByText('Hãy xem lại khoảng ngày trước khi tạo chuyến.', { exact: true }).waitFor();
  assert.match(await dialog.locator('.wzsum').innerText(), /Ngày/);
  assert.match(await dialog.innerText(), /Nơi đã chọn:/);
  await dialog.getByRole('button', { name: 'Tạo chuyến đi', exact: true }).click();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.thead h1').waitFor();
  const toast = page.locator('.toast');
  await toast.waitFor();
  const target = page.getByRole('button', { name: 'Xếp giúp tôi', exact: true });
  const a = await toast.boundingBox();
  const b = await target.boundingBox();
  assert.ok(a && b && (a.y + a.height <= b.y || b.y + b.height <= a.y));
  await page.getByRole('button', { name: 'Mời bạn', exact: true }).click();
  assert.equal(await toast.count(), 0);
  await page.getByRole('dialog', { name: 'Người đi cùng' }).waitFor();
  await page.getByRole('button', { name: 'Đóng', exact: true }).click();
  await page.getByRole('button', { name: 'Chuẩn bị', exact: true }).click();
  await page.getByLabel('Hạng mục', { exact: true }).waitFor();
  const stored = await storedTrips(page);
  assert.equal(stored.trips[0]?.items.length, 2);
  assert.ok(stored.trips[0]?.items.every((i) => i.day === null && i.placeId));
  await page.goto(`${baseUrl}/#/picked`);
  await page.getByText('Chưa chọn nơi nào').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tạo từng bước: sai ngày bị chặn ở đúng bước; kiểu chuyến, sở thích, ngân sách được LƯU vào chuyến (DR-018 F2)', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await page.getByRole('button', { name: 'Tạo từng bước' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Đi đâu' }).waitFor();
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByRole('heading', { name: 'Khi nào' }).waitFor();
  const start = await dialog.getByLabel('Ngày đi').inputValue();
  await dialog.getByLabel('Ngày về').fill('2020-01-01');
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByRole('alert').getByText('Ngày về phải sau hoặc bằng ngày đi.').waitFor();
  await dialog.getByLabel('Ngày về').fill(start);
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByRole('button', { name: 'Bạn bè' }).click();
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByRole('button', { name: 'Cảnh quan' }).click();
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByLabel(/Ngân sách/).fill('2000');
  await dialog.getByRole('button', { name: 'Tiếp' }).click();
  await dialog.getByRole('heading', { name: 'Xem lại' }).waitFor();
  assert.match((await dialog.locator('.wzsum').textContent()) ?? '', /Bạn bè/);
  await dialog.getByRole('button', { name: 'Tạo chuyến đi' }).click();
  await page.getByRole('button', { name: 'Để sau, lưu chuyến đi luôn' }).click();
  await page.locator('.thead h1').waitFor();
  const saved = (await storedTrips(page)).trips[0]!;
  assert.equal(saved.kind, 'friends');
  assert.deepEqual(saved.interests, ['canh']);
  assert.equal(saved.budgetK, 2000);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('chi phí theo D17/D18: trống là chưa biết, 0 là biết bằng không, "đã bao gồm" không cộng; ngân sách còn lại', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  const box = page.locator('.costbox');
  await box.waitFor();
  assert.match((await box.locator('.bigmoney b').textContent()) ?? '', /^Đã biết 750\.000\s₫, 4 mục chưa biết giá$/);
  assert.match((await box.textContent()) ?? '', /Chưa tính 4 mục chưa biết giá/);
  assert.match((await box.textContent()) ?? '', /1 mục đã bao gồm, không cộng vào tổng/);
  assert.match((await box.textContent()) ?? '', /còn lại 2\.250\.000\s₫/);
  assert.match((await box.textContent()) ?? '', /Đã đặt 1\/\d+ mục có đặt chỗ/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('xếp ngày bằng chip, thấy ở tab ngày; Hoàn tác bằng thông báo đưa mục về chưa có ngày', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  const row = page.locator('.swipe', { hasText: 'Phố cổ Đồng Văn' });
  await row.locator('xpath=following-sibling::div[contains(@class,"assign")][1]').getByRole('button', { name: 'Ngày 2' }).click();
  await page.getByRole('tab', { name: 'Ngày 2' }).click();
  await page.locator('.irow', { hasText: 'Phố cổ Đồng Văn' }).waitFor();
  const stored = await storedTrips(page);
  assert.ok(stored.trips[0]?.items.find((i) => i.placeId === 'pho-co-dong-van')?.day);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('sắp xếp trong ngày: nút lên/xuống đổi vị trí và lưu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  const names = async (): Promise<string[]> => page.locator('.irow h3').allTextContents();
  const before = await names();
  await page.getByRole('button', { name: new RegExp(`Chuyển «${before[1]}» lên`) }).click();
  const after = await settle(names, (n) => n[0] === before[1]);
  assert.equal(after[0], before[1]);
  assert.equal(after[1], before[0]);
  await page.reload();
  await page.getByRole('tab', { name: 'Ngày 1' }).waitFor();
  assert.equal((await names())[0], before[1], 'thứ tự được lưu');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('sửa mục: kiểm lỗi tiền âm; xóa giá thành "Chưa biết giá"; lưu rồi Hoàn tác khôi phục', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Chi phí, nghìn đồng/).fill('-5');
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await dialog.getByRole('alert').getByText(/chỉ nhập số từ 0 trở lên/).waitFor();
  await dialog.getByLabel(/Chi phí, nghìn đồng/).fill('');
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click();
  await dialog.waitFor({ state: 'detached' });
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).getByText('Chưa biết giá').waitFor();
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).getByText(/120\.000/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('thêm mục tự do và việc cần làm; tích xong việc cần làm', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/2', true);
  await page.getByRole('button', { name: 'Thêm mục vào ngày này' }).click();
  await page.getByRole('button', { name: /^Việc cần làm/ }).click();
  await page.getByRole('dialog').getByLabel('Tên').fill('Mua vé');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click();
  const task = page.locator('.swipe', { hasText: 'Mua vé' });
  await task.waitFor();
  const toggle = task.getByRole('button', { name: /Hoàn thành: Mua vé/ });
  assert.equal(await toggle.getAttribute('aria-pressed'), 'false');
  await toggle.click();
  await page.locator('.swipe', { hasText: 'Mua vé' }).locator('button[aria-pressed="true"]').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('sửa ngày chuyến làm mất ngày: báo số mục, bấm Lưu lần hai xác nhận, mục về "Chưa có ngày", Hoàn tác được (DR-011 A1)', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.getByRole('button', { name: 'Sửa chuyến đi' }).click();
  const dialog = page.getByRole('dialog', { name: 'Sửa chuyến đi' });
  const start = await dialog.getByLabel('Ngày đi').inputValue();
  await dialog.getByLabel('Ngày về').fill(start);
  await dialog.getByLabel(/Dời cả lịch/).uncheck();
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await dialog.getByRole('alert').getByText(/chuyển về “Chưa có ngày”/).waitFor();
  await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await dialog.waitFor({ state: 'detached' });
  const unscheduled = (): Promise<number | undefined> => settle(async () => (await storedTrips(page)).trips[0]?.items.filter((i) => i.day === null).length, (n) => n === 3 + 2 + 2);
  assert.equal(await unscheduled(), 3 + 2 + 2, 'ngày 2 và 3 trở về chưa có ngày');
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  assert.equal(await settle(async () => (await storedTrips(page)).trips[0]?.items.filter((i) => i.day === null).length, (n) => n === 3), 3);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('"Xếp giúp tôi": xem trước rồi áp dụng; mọi mục có ngày; Hoàn tác', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.getByRole('button', { name: 'Xếp giúp tôi' }).click();
  await page.locator('.plan').waitFor();
  await page.getByRole('button', { name: 'Áp dụng gợi ý' }).click();
  await page.getByText('Mọi địa điểm đã có ngày', { exact: true }).first().waitFor();
  assert.equal((await storedTrips(page)).trips[0]?.items.filter((i) => i.day === null).length, 0);
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  assert.equal(await settle(async () => (await storedTrips(page)).trips[0]?.items.filter((i) => i.day === null).length, (n) => n === 3), 3);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('thêm địa điểm vào chuyến từ bộ thẻ: không hiện lại nơi đã có; quẹt phải thêm vào "Chưa có ngày"', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
  await page.locator('.card.front').waitFor();
  assert.match((await page.locator('.card.front h2').textContent()) ?? '', /Cổng trời Quản Bạ/, 'nơi đầu tiên chưa có trong chuyến');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await page.locator('.thead h1').waitFor();
  assert.ok((await storedTrips(page)).trips[0]?.items.some((i) => i.placeId === 'cong-troi-quan-ba' && i.day === null));
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('bản đồ chuyến: tab ngày vẽ tuyến có nhãn km và ghim đánh số', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.locator('.tmroot[data-ready="1"][data-route="1"]').waitFor({ state: 'attached', timeout: 30000 });
  assert.ok((await page.locator('.tm-seg-label').count()) >= 1);
  assert.ok(Number(await page.locator('.tmap').getAttribute('data-numbered')) >= 2);
  assert.equal(await page.locator('.tmap').getAttribute('data-clusters'), '0', 'tab ngày không gộp cụm');
  const pin = page.locator('.tmap .tm-accessible button').first();
  await pin.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('chuyến lạ có thông báo và đường về; danh sách chuyến rỗng không làm trắng trang', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await page.getByRole('button', { name: 'Đi khám phá' }).waitFor();
  await page.goto(`${baseUrl}/#/trip/khong-co/ov`);
  await page.getByText('Không tìm thấy chuyến đi').waitFor();
  await page.getByRole('button', { name: 'Về Chuyến đi' }).click();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Hoàn tác không ghi đè thao tác xen giữa: đổi chỗ sau khi lưu rồi bấm Hoàn tác thì báo không hoàn tác được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).click();
  await page.getByRole('dialog').getByLabel(/Chi phí, nghìn đồng/).fill('999');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu', exact: true }).click();
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).waitFor();
  await page.getByRole('button', { name: 'Sắp xếp' }).click();
  await page.getByRole('button', { name: /Chuyển «Ăn trưa \(mẫu\)» lên/ }).click();
  const costOf = async (): Promise<number | null | undefined> => (await storedTrips(page)).trips[0]?.items.find((i) => i.id === 'a4')?.costK;
  assert.equal(await costOf(), 999);
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  await page.getByText('không hoàn tác được').waitFor();
  assert.equal(await costOf(), 999, 'giá mới vẫn còn, không bị ghi đè');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tổng tiền vượt 1.000.000.000 nghìn đồng không làm sập màn chuyến đi', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  const token = (await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? 'null') as { token: string }).token, TOKEN_KEY));
  const t = (await storedTrips(page)).trips[0]!;
  for (const alias of ['a1', 'a2']) {
    const real = [...seededOf(page).alias].find(([, v]) => v === alias)![0];
    const r = await api('PATCH', `/api/trips/${t.id}/items/${real}`, token, { cost: 900000000 });
    assert.equal(r.status < 300, true, 'máy chủ nhận giá lớn');
  }
  await page.reload();
  await page.locator('.costbox .bigmoney b').waitFor();
  assert.match((await page.locator('.costbox .bigmoney b').textContent()) ?? '', /^Đã biết 1\.800\.000\.720\.000/);
  assert.equal(await page.getByRole('alert').count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tab chuyến đi: mũi tên đổi tab, chỉ tab đang chọn nằm trong thứ tự Tab, tabpanel gắn nhãn theo tab', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.getByRole('tab', { name: 'Tổng quan' }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('tab', { name: 'Ngày 1', selected: true }).waitFor();
  assert.equal(await page.getByRole('tab', { name: 'Ngày 2' }).getAttribute('tabindex'), '-1');
  assert.equal(await page.getByRole('tabpanel').getAttribute('aria-labelledby'), 'trip-tab-1');
  await page.keyboard.press('End');
  await page.getByRole('tab', { name: 'Ngày 3', selected: true }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

/** Đọc lại tới khi điều kiện đúng (tối đa 8 giây): thao tác giờ đi qua máy chủ nên giao diện cập nhật sau một nhịp. */
async function settle<T>(read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> {
  const until = Date.now() + 8000;
  let value = await read();
  while (!ok(value) && Date.now() < until) {
    await new Promise((r) => setTimeout(r, 100));
    value = await read();
  }
  return value;
}

/** Số mục (chưa xóa) của chuyến mẫu và số mục trong thùng rác (mã mục mẫu là bí danh), đọc từ máy chủ. */
async function trashCounts(page: Page): Promise<{ items: number; trash: number; ids: string[] }> {
  const t = (await storedTrips(page)).trips[0]!;
  const token = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? 'null') as { token: string }).token, TOKEN_KEY);
  const trash = ((await api('GET', `/api/trips/${t.id}/trash`, token)).body?.['items'] ?? []) as { id: string }[];
  const alias = seededOf(page).alias;
  return { items: t.items.length, trash: trash.length, ids: trash.map((x) => alias.get(x.id) ?? x.id) };
}

test('xóa mục từ trình sửa: vào Đã xóa gần đây, Hoàn tác đưa về đúng chỗ; khôi phục từ thùng rác về đúng ngày và vị trí', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  const before = await trashCounts(page);
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa khỏi chuyến đi' }).click();
  await page.getByRole('status').getByText(/Đã xóa «Ăn trưa \(mẫu\)»/).waitFor();
  assert.deepEqual(await trashCounts(page), { items: before.items - 1, trash: 1, ids: ['a4'] });
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).waitFor();
  assert.deepEqual(await trashCounts(page), { items: before.items, trash: 0, ids: [] });
  // xóa lại rồi khôi phục từ thùng rác
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa khỏi chuyến đi' }).click();
  await page.getByRole('tab', { name: 'Tổng quan' }).click();
  await page.getByRole('button', { name: /Đã xóa gần đây \(1\)/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Ăn trưa (mẫu)').waitFor();
  await dialog.getByRole('button', { name: 'Khôi phục «Ăn trưa (mẫu)»' }).click();
  await dialog.getByText('Chưa có mục nào bị xóa').waitFor();
  const stored = (await storedTrips(page)).trips[0]!.items.find((i) => i.id === 'a4')!;
  assert.equal(stored.position, 3, 'về đúng vị trí cũ trong ngày');
  assert.ok(stored.day, 'về đúng ngày cũ');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('xóa vĩnh viễn hỏi xác nhận; Hủy giữ nguyên, Xóa vĩnh viễn làm mất hẳn', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.locator('.irow', { hasText: 'Ăn trưa (mẫu)' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa khỏi chuyến đi' }).click();
  await page.getByRole('tab', { name: 'Tổng quan' }).click();
  await page.getByRole('button', { name: /Đã xóa gần đây \(1\)/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Xóa vĩnh viễn «Ăn trưa (mẫu)»' }).click();
  await dialog.getByRole('heading', { name: /Xóa vĩnh viễn «Ăn trưa \(mẫu\)»\?/ }).waitFor();
  await dialog.getByRole('button', { name: 'Hủy' }).click();
  assert.equal((await trashCounts(page)).trash, 1);
  await dialog.getByRole('button', { name: 'Xóa vĩnh viễn «Ăn trưa (mẫu)»' }).click();
  await dialog.getByRole('button', { name: 'Xóa vĩnh viễn', exact: true }).click();
  await dialog.getByText('Chưa có mục nào bị xóa').waitFor();
  assert.deepEqual(await trashCounts(page), { items: (await trashCounts(page)).items, trash: 0, ids: [] });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('xóa địa điểm từ tờ chi tiết của chuyến; khôi phục khi ngày cũ không còn nói rõ về Chưa có ngày', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/1', true);
  await page.locator('.irow', { hasText: 'Dinh thự họ Vương' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa khỏi chuyến đi' }).click();
  await page.getByRole('status').getByText(/Đã xóa «/).waitFor();
  assert.deepEqual((await trashCounts(page)).ids, ['a2']);
  // dời ngày đi lên một ngày: ngày đầu không còn trong chuyến
  await page.getByRole('tab', { name: 'Tổng quan' }).click();
  await page.getByRole('button', { name: 'Sửa chuyến đi' }).click();
  const edit = page.getByRole('dialog', { name: 'Sửa chuyến đi' });
  const start = await edit.getByLabel('Ngày đi').inputValue();
  const next = new Date(`${start}T00:00:00`);
  next.setDate(next.getDate() + 1);
  const iso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
  await edit.getByLabel('Ngày đi').fill(iso);
  await edit.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await edit.getByRole('alert').waitFor();
  await edit.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await edit.waitFor({ state: 'detached' });
  await page.getByRole('button', { name: /Đã xóa gần đây \(1\)/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Khôi phục «/ }).click();
  // máy chủ gỡ ngày của cả mục đã xóa khi khoảng ngày đổi, nên chỉ còn biết mục về "Chưa có ngày"
  await page.getByRole('status').getByText(/Đã khôi phục «/).waitFor();
  assert.equal((await settle(async () => (await storedTrips(page)).trips[0]!.items.find((i) => i.id === 'a2'), (i) => i !== undefined))!.day, null);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('xóa mềm cả chuyến: xác nhận, rời danh sách (máy chủ); Hoàn tác đưa về; "Chuyến đã xóa gần đây" khôi phục được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.getByRole('button', { name: 'Xóa chuyến đi' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Giữ lại' }).click();
  assert.equal((await storedTrips(page)).trips.length, 1, 'Giữ lại thì không xóa');
  await page.getByRole('button', { name: 'Xóa chuyến đi' }).click();
  await dialog.getByRole('button', { name: 'Xóa chuyến đi' }).click();
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  await page.getByRole('status').getByText(/Đã xóa chuyến «/).waitFor();
  assert.equal((await settle(async () => (await storedTrips(page)).trips.length, (n) => n === 0)), 0);
  await page.getByRole('status').getByRole('button', { name: 'Hoàn tác' }).click();
  await page.locator('.thead h1').waitFor();
  assert.equal((await storedTrips(page)).trips.length, 1);
  // xóa lần nữa rồi khôi phục từ danh sách đã xóa
  await page.getByRole('button', { name: 'Xóa chuyến đi' }).click();
  await dialog.getByRole('button', { name: 'Xóa chuyến đi' }).click();
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Chuyến đã xóa gần đây' }).click();
  await dialog.getByRole('button', { name: 'Khôi phục' }).click();
  await page.locator('.thead h1').waitFor();
  assert.equal((await storedTrips(page)).trips.length, 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Hôm nay → cả chuyến → danh sách: ba vòng và URL trực tiếp có lối về rõ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trip/mau-ha-giang/ov', true);
  await page.locator('.thead h1').waitFor();
  const tripHash = new URL(page.url()).hash;
  for (let round = 0; round < 3; round += 1) {
    await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
    await page.getByRole('button', { name: 'Xem cả chuyến', exact: true }).click();
    await page.getByRole('button', { name: 'Về Chuyến đi', exact: true }).click();
    await page.waitForURL(/#\/trips$/);
    await page.goto(baseUrl + '/' + tripHash);
    await page.locator('.thead h1').waitFor();
  }
  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click();
  await page.getByRole('button', { name: 'Xem cả chuyến', exact: true }).click();
  await page.goBack();
  await page.waitForURL(/#\/trips$/);
  await page.goto(baseUrl + '/' + tripHash);
  await page.reload();
  await page.getByRole('button', { name: 'Về Chuyến đi', exact: true }).click();
  await page.waitForURL(/#\/trips$/);
  assert.deepEqual(errors, []);
  await ctx.close();
});
