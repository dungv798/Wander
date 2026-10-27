// Kiểm thử đầu-cuối của danh tính ẩn danh (FE-7, máy chủ giả): lưu lần đầu, mã khôi phục + nhập lại 2 nhóm, Bảo mật, ghép thiết bị
// bằng số khớp, thu hồi, xác thực lại và khôi phục trên máy mới. Chạy trên trình duyệt thật, khung điện thoại.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

const SERVER_KEY = 'wander.web.server.v1';
const SESSION_KEY = 'wander.web.session.v1';
const LATER = 'Để sau, lưu chuyến đi luôn';

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

/** Trang sạch (xóa lưu trữ) rồi tới địa chỉ hash. */
async function open(ctx: BrowserContext, hash: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); // bỏ qua giới thiệu lần đầu (có test riêng)
  });
  await page.reload(); // kho "đã xem giới thiệu" đọc lúc khởi tạo nên phải nạp lại
  await page.goto(`${baseUrl}/${hash}`);
  return page;
}

/** Đọc một khóa localStorage đã parse. */
async function stored(page: Page, key: string): Promise<Record<string, unknown>> {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null') ?? {}, key);
}

/** Bấm "Tạo chuyến đi" ở màn Chuyến đi (tờ tạo nhanh) để chạm cổng danh tính. */
async function startSaving(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/#/trips`);
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).first().click();
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).last().click();
}

/** Từ cổng danh tính: tạo danh tính, đọc mã, nhập lại đúng 2 nhóm được hỏi, xác nhận, bấm Xong. Trả mã (6 nhóm). */
async function makeIdentityWithCode(page: Page, finishLabel = 'Xong, tôi đã lưu mã'): Promise<string[]> {
  await page.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click();
  const code = await page.locator('.codebox span').allTextContents();
  assert.equal(code.length, 6);
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  await answerChallenge(page, code);
  await page.getByRole('button', { name: finishLabel }).click();
  return code;
}

/** Nhập đúng các nhóm hệ thống hỏi ("Nhóm 3 (5 ký hiệu)") rồi bấm Xác nhận. */
async function answerChallenge(page: Page, code: string[]): Promise<void> {
  const dialog = page.getByRole('dialog').last();
  const labels = await dialog.locator('label.field').allTextContents();
  assert.equal(labels.length, 2, 'hệ thống hỏi đúng 2 nhóm');
  for (const text of labels) {
    const n = Number(/Nhóm (\d)/.exec(text)?.[1]);
    await dialog.getByLabel(new RegExp(`Nhóm ${n} `)).fill(code[n - 1] ?? '');
  }
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
}

test('lưu lần đầu "Để sau": chuyến đi vẫn được lưu, danh tính ẩn danh chưa có mã, Bảo mật nhắc tạo mã', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('heading', { name: 'Lưu chuyến đi của bạn' }).waitFor();
  await page.getByText(/Chưa có mã khôi phục thì mất máy là mất chuyến đi/).waitFor();
  await page.getByRole('button', { name: LATER }).click();
  await page.locator('.thead h1').waitFor();
  await page.getByRole('status').getByText(/Bạn chưa có mã khôi phục/).waitFor();
  const server = (await stored(page, SERVER_KEY)) as { identity: { codeHash: string | null; devices: unknown[] } };
  assert.equal(server.identity.codeHash, null);
  assert.equal(server.identity.devices.length, 1);
  await page.goto(`${baseUrl}/#/security`);
  await page.getByText(/Bạn chưa có mã khôi phục\. Nếu mất thiết bị này/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mã khôi phục: hiện một lần, nhập lại 2 nhóm, sai thì "chưa khớp", Esc không đóng, máy chủ không giữ mã đọc được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click();
  const code = await page.locator('.codebox span').allTextContents();
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor();
  assert.equal(await stored(page, SESSION_KEY).then((s) => s['deviceId'] ?? null), null, 'chưa nhập lại thì chưa có danh tính');
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Nhập lại 2 nhóm để xác nhận' }).waitFor();
  await dialog.locator('input').first().fill('SAISAI');
  await dialog.getByRole('button', { name: 'Xác nhận' }).click();
  await dialog.getByRole('alert').getByText(/Chưa khớp/).waitFor();
  await answerChallenge(page, code);
  await dialog.getByRole('heading', { name: 'Đã lưu mã khôi phục' }).waitFor();
  await page.getByRole('button', { name: 'Xong, tôi đã lưu mã' }).click();
  await page.locator('.thead h1').waitFor();
  const dump = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
  for (const group of code) assert.ok(!dump.includes(group), 'không nhóm mã nào nằm trong dữ liệu lưu');
  assert.match(((await stored(page, SERVER_KEY)) as { identity: { codeHash: string } }).identity.codeHash, /^h1:/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('hủy giữa chừng khi hiện mã: không tạo danh tính, không tạo chuyến đi', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click();
  await page.getByRole('button', { name: 'Hủy, chưa lưu chuyến đi' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor({ state: 'detached' });
  assert.equal((await stored(page, SESSION_KEY))['deviceId'] ?? null, null);
  assert.equal(((await stored(page, 'wander.web.trips.v1')) as { trips?: unknown[] }).trips?.length ?? 0, 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tạo mã mới cần xác thực lại bằng mã: mã sai bị từ chối, mã đúng cho mã mới; mã cũ hết hiệu lực sau khi xác nhận', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  const old = await makeIdentityWithCode(page);
  await page.locator('.thead h1').waitFor();
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Tạo mã mới' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Tạo mã khôi phục mới' }).waitFor();
  await dialog.getByLabel('Mã khôi phục').fill('00000-00000-00000-00000-00000-00000');
  await dialog.getByRole('button', { name: 'Xác thực' }).click();
  await dialog.getByRole('alert').getByText(/Mã chưa đúng/).waitFor();
  await dialog.getByLabel('Mã khôi phục').fill(old.join('-'));
  await dialog.getByRole('button', { name: 'Xác thực' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục mới' }).waitFor();
  const fresh = await page.locator('.codebox span').allTextContents();
  assert.notDeepEqual(fresh, old);
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  await answerChallenge(page, fresh);
  await page.getByRole('button', { name: 'Xong, tôi đã lưu mã' }).click();
  // mã cũ không còn xác thực được
  await page.getByRole('button', { name: 'Tạo mã mới' }).click();
  await dialog.getByLabel('Mã khôi phục').fill(old.join('-'));
  await dialog.getByRole('button', { name: 'Xác thực' }).click();
  await dialog.getByRole('alert').getByText(/Mã chưa đúng/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('ghép thiết bị mới bằng số khớp: chọn sai số thì từ chối, chọn đúng số thì duyệt; có hạn mức yêu cầu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: LATER }).click();
  await page.goto(`${baseUrl}/#/security`);
  const pairingOf = async (): Promise<{ code: string; number: number; status: string }> => ((await stored(page, SERVER_KEY)) as { pairing: { code: string; number: number; status: string } }).pairing;
  // lần 1: chọn sai số
  await page.getByRole('button', { name: 'Giả lập: máy mới xin ghép' }).click();
  let p = await pairingOf();
  await page.getByLabel('Mã ghép trên máy mới').fill(`${p.code.slice(0, 4)}-${p.code.slice(4)}`);
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  const dialog = page.getByRole('dialog', { name: 'Duyệt thiết bị mới?' });
  await dialog.getByText(/Tên do thiết bị tự khai, chưa được xác minh/).waitFor();
  assert.equal(await dialog.getByRole('button', { name: /^Số \d+$/ }).count(), 3, 'ba lựa chọn số khớp');
  const wrong = await dialog.getByRole('button', { name: /^Số \d+$/ }).evaluateAll((els, real) => els.map((e) => e.textContent).find((t) => Number(t) !== real) ?? '', p.number);
  await dialog.getByRole('button', { name: `Số ${wrong}` }).click();
  await page.getByRole('status').getByText(/Số không khớp nên yêu cầu bị từ chối/).waitFor();
  assert.equal((await pairingOf()).status, 'denied');
  // lần 2: chọn đúng số
  await page.getByRole('button', { name: 'Giả lập: máy mới xin ghép' }).click();
  p = await pairingOf();
  await page.getByLabel('Mã ghép trên máy mới').fill(p.code.toLowerCase());
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await dialog.getByRole('button', { name: `Số ${p.number}` }).click();
  await page.getByRole('status').getByText(/Đã duyệt «/).waitFor();
  assert.equal((await pairingOf()).status, 'approved');
  // lần 3 ok, lần 4 vượt hạn mức 3 yêu cầu / 10 phút: không có yêu cầu mới
  await page.getByRole('button', { name: 'Giả lập: máy mới xin ghép' }).click();
  const third = await pairingOf();
  await page.getByRole('button', { name: 'Giả lập: máy mới xin ghép' }).click();
  assert.equal((await pairingOf()).code, third.code, 'quá hạn mức: không sinh mã mới');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('thêm thiết bị thứ hai rồi thu hồi: hỏi xác nhận, thiết bị biến mất và ghi vào Hoạt động gần đây', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: LATER }).click();
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Giả lập: thêm thiết bị thứ hai' }).click();
  await page.locator('.devrow', { hasText: 'Máy tính bảng' }).waitFor();
  await page.getByRole('button', { name: 'Thu hồi Máy tính bảng' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Thu hồi «Máy tính bảng»?' }).waitFor();
  await dialog.getByRole('button', { name: 'Hủy' }).click();
  await page.locator('.devrow', { hasText: 'Máy tính bảng' }).waitFor();
  await page.getByRole('button', { name: 'Thu hồi Máy tính bảng' }).click();
  await dialog.getByRole('button', { name: 'Thu hồi', exact: true }).click();
  await page.locator('.devrow', { hasText: 'Máy tính bảng' }).waitFor({ state: 'detached' });
  await page.locator('.evlist').getByText('Đã thu hồi «Máy tính bảng»').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mở chuyến đi trên máy mới bằng mã: sai 5 lần bị khóa; đúng thì nhận mã thay thế, nhập lại 2 nhóm rồi vào; thiết bị cũ còn nguyên', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  const code = await makeIdentityWithCode(page);
  await page.locator('.thead h1').waitFor();
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Giả lập: máy này mất dữ liệu' }).click();
  await page.getByRole('heading', { name: 'Chưa có danh tính' }).waitFor();
  await page.goto(`${baseUrl}/#/recover`);
  const field = page.getByLabel('Mã khôi phục');
  for (let i = 0; i < 5; i += 1) {
    await field.fill('00000-00000-00000-00000-00000-00000');
    if (i < 4) await page.getByRole('button', { name: 'Tiếp tục' }).click();
  }
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('alert').getByText(/thử quá nhiều lần/).waitFor();
  await page.reload();
  await page.getByRole('alert').getByText(/thử quá nhiều lần/).waitFor(); // khóa bền: tải lại không mở khóa
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Mã khôi phục' }).click();
  await page.getByRole('alert').getByText(/thử quá nhiều lần/).waitFor(); // đổi chế độ cũng không mở khóa
  await page.evaluate(() => {
    const k = 'wander.web.locks.v1';
    const s = JSON.parse(localStorage.getItem(k) ?? '{}');
    s.recover.until = Date.now() - 1000; // hết hạn khóa 15 phút
    localStorage.setItem(k, JSON.stringify(s));
  });
  await page.reload();
  await page.getByLabel('Mã khôi phục').fill(code.join(' ').toLowerCase());
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục mới' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Để sau (chuyến đi vẫn được lưu)' }).count(), 0, 'khôi phục không có nút bỏ qua');
  const replacement = await page.locator('.codebox span').allTextContents();
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  await answerChallenge(page, replacement);
  await page.getByRole('button', { name: 'Xong, tôi đã lưu mã' }).click();
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  await page.goto(`${baseUrl}/#/security`);
  await page.locator('.infobox b', { hasText: 'Đã mở chuyến đi trên máy này' }).waitFor();
  assert.equal(await page.locator('.devrow').count(), 2, 'thiết bị cũ không bị thu hồi (QĐ-3)');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mở chuyến đi bằng thiết bị cũ duyệt: máy mới hiện mã ghép và số khớp, được duyệt thì vào danh sách thiết bị tin cậy', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: LATER }).click();
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Giả lập: máy này mất dữ liệu' }).click();
  await page.goto(`${baseUrl}/#/recover`);
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Hiện mã ghép' }).click();
  await page.locator('.pairbox .pcode').first().waitFor();
  await page.getByText('Đang chờ thiết bị cũ duyệt…').waitFor();
  await page.getByRole('button', { name: 'Giả lập: thiết bị cũ duyệt (đúng số)' }).click();
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  const server = (await stored(page, SERVER_KEY)) as { identity: { devices: unknown[] }; pairing: unknown };
  assert.equal(server.identity.devices.length, 2);
  assert.equal(server.pairing, null);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('máy mất phiên mà danh tính còn trên máy chủ: lưu chuyến đi không tạo danh tính mới đè lên mà dẫn tới "Mở trên máy này"', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: LATER }).click();
  await page.goto(`${baseUrl}/#/security`);
  const before = JSON.stringify((await stored(page, SERVER_KEY)) as object);
  await page.getByRole('button', { name: 'Giả lập: máy này mất dữ liệu' }).click();
  await startSaving(page);
  await page.getByRole('heading', { name: 'Mở chuyến đi trên máy này' }).waitFor();
  await page.getByRole('status').getByText(/chưa mở trên máy này/).waitFor();
  assert.equal(JSON.stringify(await stored(page, SERVER_KEY)), before, 'danh tính trên máy chủ không đổi');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('duyệt đã hết hạn thì máy mới KHÔNG tự vào; hiện báo hết hạn và cho xin mã mới', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: LATER }).click();
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Giả lập: máy này mất dữ liệu' }).click();
  await page.goto(`${baseUrl}/#/recover`);
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Hiện mã ghép' }).click();
  await page.locator('.pairbox .pcode').first().waitFor();
  await page.evaluate(() => {
    const k = 'wander.web.server.v1';
    const s = JSON.parse(localStorage.getItem(k) ?? '{}');
    s.pairing.status = 'approved';
    s.pairing.at = Date.now() - 3_600_000; // duyệt từ một giờ trước
    localStorage.setItem(k, JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByText('Mã ghép đã hết hạn. Hiện mã mới để thử lại.').waitFor();
  assert.equal(((await stored(page, SERVER_KEY)) as { identity: { devices: unknown[] } }).identity.devices.length, 1, 'không tự thêm thiết bị');
  assert.deepEqual(errors, []);
  await ctx.close();
});
