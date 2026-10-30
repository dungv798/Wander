// Kiểm thử đầu-cuối của danh tính ẩn danh (FE-10c, BACKEND THẬT cổng 8787): lưu lần đầu, mã khôi phục + nhập lại 2 nhóm, Bảo mật, ghép
// thiết bị bằng số khớp, thu hồi, xác thực lại và khôi phục trên máy mới. Trình duyệt thật, khung điện thoại; "thiết bị khác" là lời gọi API.
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { TOKEN_KEY, addDevice, api, createOwner, devicesOf, field, loginAs, newToken } from './backend.ts';

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
      // 4xx là phản hồi bình thường của các ca "sai mã/sai số" mà test chủ đích gây ra
      if (m.type() === 'error' && !/status of 4\d\d/.test(m.text())) errors.push(m.text());
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

/** Bí mật phiên của máy này trong localStorage (null nếu chưa có). */
async function tokenOf(page: Page): Promise<string | null> {
  return page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? 'null') as { token?: string } | null)?.token ?? null, TOKEN_KEY);
}

/** Chủ đã có mã khôi phục có hiệu lực chưa, theo máy chủ. */
async function hasCode(token: string): Promise<boolean> {
  return (await api('GET', '/api/recovery-code', token)).body?.['hasCode'] === true;
}

/** Bấm "Tạo chuyến đi" ở màn Chuyến đi (tờ tạo nhanh) để chạm cổng danh tính. */
async function startSaving(page: Page): Promise<void> {
  await page.goto(`${baseUrl}/#/trips`);
  await page.getByRole('button', { name: 'Tạo chuyến đi' }).first().click();
  // Tờ tạo chuyến được tải lười: bấm nút trong hộp thoại, không dùng .last() (sẽ chọn nhầm nút của trang khi tờ chưa hiện)
  await page.getByRole('dialog').getByRole('button', { name: 'Tạo chuyến đi', exact: true }).click();
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

test('lưu lần đầu "Để sau": chuyến đi vẫn được lưu, danh tính ẩn danh chưa có mã (theo máy chủ), Bảo mật nhắc tạo mã', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('heading', { name: 'Lưu chuyến đi của bạn' }).waitFor();
  await page.getByText(/Chưa có mã khôi phục thì mất máy là mất chuyến đi/).waitFor();
  await page.getByRole('button', { name: LATER }).click();
  await page.locator('.thead h1').waitFor();
  await page.getByRole('status').getByText(/Bạn chưa có mã khôi phục/).waitFor();
  const token = await tokenOf(page);
  assert.ok(token, 'đã có bí mật phiên');
  assert.equal((await devicesOf(token)).length, 1);
  assert.equal(await hasCode(token), false);
  await page.goto(`${baseUrl}/#/security`);
  await page.getByText(/Bạn chưa có mã khôi phục\. Nếu mất thiết bị này/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mã khôi phục: hiện một lần, nhập lại 2 nhóm, sai thì "chưa khớp", Esc không đóng; mã chỉ có hiệu lực sau khi nhập lại đúng; mã không nằm trong dữ liệu lưu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor();
  const code = await page.locator('.codebox span').allTextContents();
  assert.equal(code.length, 6);
  await page.keyboard.press('Escape');
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor();
  const token = (await tokenOf(page)) ?? '';
  assert.equal(await hasCode(token), false, 'chưa nhập lại thì mã chưa có hiệu lực');
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
  assert.equal(await hasCode(token), true);
  const dump = await page.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(localStorage))));
  for (const group of code) assert.ok(!dump.includes(group), 'không nhóm mã nào nằm trong dữ liệu lưu');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('hủy giữa chừng khi hiện mã: không tạo chuyến đi và mã chưa có hiệu lực (danh tính ẩn danh có thể đã được tạo, chưa có mã)', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  await startSaving(page);
  await page.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor();
  const token = (await tokenOf(page)) ?? '';
  await page.getByRole('button', { name: 'Hủy, chưa lưu chuyến đi' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục của bạn' }).waitFor({ state: 'detached' });
  assert.equal(await hasCode(token), false);
  assert.equal(((await stored(page, 'wander.web.trips.v1')) as { trips?: unknown[] }).trips?.length ?? 0, 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tạo mã mới cần xác thực lại bằng mã: mã sai bị từ chối, mã đúng cho mã mới; mã cũ hết hiệu lực sau khi xác nhận', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner({ withCode: true });
  const old = (owner.code ?? '').split('-');
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Tạo mã mới' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('heading', { name: 'Tạo mã khôi phục mới' }).waitFor();
  await dialog.getByLabel('Mã khôi phục').fill('00000-00000-00000-00000-00000-00000');
  await dialog.getByRole('button', { name: 'Xác thực' }).click();
  await dialog.getByRole('alert').getByText(/Mã chưa đúng/).waitFor();
  await dialog.getByLabel('Mã khôi phục').fill(old.join('-'));
  await dialog.getByRole('button', { name: 'Xác thực' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục mới', exact: true }).waitFor();
  const fresh = await page.locator('.codebox span').allTextContents();
  assert.notDeepEqual(fresh, old);
  const early = await api('POST', '/api/recovery-code/begin', owner.token, { evidence: { type: 'code', code: fresh.join('-') } });
  assert.equal(early.status >= 400, true, 'mã mới chưa xác nhận thì chưa dùng được làm bằng chứng');
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  await answerChallenge(page, fresh);
  await page.getByRole('button', { name: 'Xong, tôi đã lưu mã' }).click();
  const oldAgain = await api('POST', '/api/recovery-code/begin', owner.token, { evidence: { type: 'code', code: old.join('-') } });
  assert.equal(oldAgain.status >= 400, true, 'mã cũ không còn xác thực được');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('xác thực lại bằng thiết bị tin cậy khác: máy này hiện mã duyệt và số khớp, máy kia chọn đúng số thì được cấp mã mới', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner({ withCode: true });
  const tablet = await addDevice(owner.token, 'Máy tính bảng');
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
  await page.getByRole('button', { name: 'Tạo mã mới' }).click();
  await page.getByRole('button', { name: 'Hiện mã duyệt' }).click();
  await page.locator('.pairbox .pcode').first().waitFor();
  const approvalCode = (await page.locator('.pairbox .pcode').nth(0).textContent()) ?? '';
  const number = Number(await page.locator('.pairbox .pcode').nth(1).textContent());
  await page.getByText('Đang chờ thiết bị tin cậy duyệt…').waitFor();
  const approved = await api('POST', '/api/step-up/approve', tablet, { approvalCode, number });
  assert.equal(approved.status < 300, true, 'thiết bị kia duyệt được');
  await page.getByRole('heading', { name: 'Mã khôi phục mới', exact: true }).waitFor();
  assert.equal((await page.locator('.codebox span').allTextContents()).length, 6);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('ghép thiết bị mới bằng số khớp: chọn sai số thì từ chối vĩnh viễn, chọn đúng số thì duyệt và thiết bị vào danh sách', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner();
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
  /** Một máy lạ xin ghép (không cần phiên): trả mã yêu cầu, mã ghép và số khớp. */
  const link = async (): Promise<{ id: string; code: string; number: number }> => {
    const r = await api('POST', '/api/device-links', null, { sessionToken: newToken(), deviceName: 'Máy lạ' });
    return { id: field<string>(r, 'requestId'), code: field<string>(r, 'pairingCode'), number: field<number>(r, 'matchNumber') };
  };
  const dialog = page.getByRole('dialog', { name: 'Duyệt thiết bị mới?' });
  const first = await link();
  await page.getByLabel('Mã ghép trên máy mới').fill(first.code);
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await dialog.getByText(/Tên do thiết bị tự khai, chưa được xác minh/).waitFor();
  assert.equal(await dialog.getByRole('button', { name: /^Số \d+$/ }).count(), 3, 'ba lựa chọn số khớp');
  const wrong = await dialog.getByRole('button', { name: /^Số \d+$/ }).evaluateAll((els, real) => els.map((e) => e.textContent).find((t) => Number(t) !== real) ?? '', first.number);
  await dialog.getByRole('button', { name: `Số ${wrong}` }).click();
  await page.getByRole('status').getByText(/Số không khớp nên yêu cầu bị từ chối/).waitFor();
  assert.equal(field<string>(await api('GET', `/api/device-links/${first.id}`, null), 'status'), 'denied');
  assert.equal((await devicesOf(owner.token)).length, 1);
  const second = await link();
  await page.getByLabel('Mã ghép trên máy mới').fill(second.code.toLowerCase());
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await dialog.getByRole('button', { name: `Số ${second.number}` }).click();
  await page.getByRole('status').getByText(/Đã duyệt «/).waitFor();
  assert.equal(field<string>(await api('GET', `/api/device-links/${second.id}`, null), 'status'), 'approved');
  assert.equal((await devicesOf(owner.token)).length, 2);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mã ghép sai: báo chung, đếm lần thử và khóa tạm sau 5 lần (bền qua tải lại)', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner();
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
  for (let i = 0; i < 5; i += 1) {
    await page.getByLabel('Mã ghép trên máy mới').fill('ABCD-EFGH');
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
  }
  await page.getByRole('alert').getByText(/thử quá nhiều lần/).waitFor();
  await page.reload();
  await page.getByRole('alert').getByText(/thử quá nhiều lần/).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('thêm thiết bị thứ hai rồi thu hồi: hỏi xác nhận, thiết bị biến mất (theo máy chủ) và ghi vào Hoạt động gần đây', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner();
  await addDevice(owner.token, 'Máy tính bảng');
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
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
  assert.equal((await devicesOf(owner.token)).length, 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mở chuyến đi trên máy mới bằng mã: sai 5 lần bị khóa; đúng thì nhận mã thay thế, nhập lại 2 nhóm rồi vào; thiết bị cũ còn nguyên', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/recover');
  const owner = await createOwner({ withCode: true });
  const codeField = page.getByLabel('Mã khôi phục');
  for (let i = 0; i < 5; i += 1) {
    await codeField.fill('00000-00000-00000-00000-00000-00000');
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
  await page.getByLabel('Mã khôi phục').fill((owner.code ?? '').split('-').join(' ').toLowerCase());
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  await page.getByRole('heading', { name: 'Mã khôi phục mới', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Để sau (chuyến đi vẫn được lưu)' }).count(), 0, 'khôi phục không có nút bỏ qua');
  const replacement = await page.locator('.codebox span').allTextContents();
  assert.equal((await devicesOf(owner.token)).length, 1, 'chưa nhập lại thì chưa có phiên mới');
  await page.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click();
  await answerChallenge(page, replacement);
  await page.getByRole('button', { name: 'Xong, tôi đã lưu mã' }).click();
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  await page.goto(`${baseUrl}/#/security`);
  await page.locator('.infobox b', { hasText: 'Đã mở chuyến đi trên máy này' }).waitFor();
  assert.equal(await page.locator('.devrow').count(), 2, 'thiết bị cũ không bị thu hồi (QĐ-3)');
  assert.equal((await devicesOf(owner.token)).length, 2);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('mở chuyến đi bằng thiết bị cũ duyệt: máy mới hiện mã ghép và số khớp, được duyệt thì vào danh sách thiết bị tin cậy', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/recover');
  const owner = await createOwner();
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Hiện mã ghép' }).click();
  await page.locator('.pairbox .pcode').first().waitFor();
  await page.getByText('Đang chờ thiết bị cũ duyệt…').waitFor();
  const pairingCode = (await page.locator('.pairbox .pcode').nth(0).textContent()) ?? '';
  const number = Number(await page.locator('.pairbox .pcode').nth(1).textContent());
  const approved = await api('POST', '/api/device-links/approve', owner.token, { pairingCode, number });
  assert.equal(approved.status < 300, true);
  await page.getByRole('heading', { name: 'Chuyến đi', exact: true }).waitFor();
  assert.equal((await devicesOf(owner.token)).length, 2);
  assert.ok(await tokenOf(page), 'máy này nhận bí mật phiên sau khi được duyệt');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('thiết bị cũ từ chối: máy mới KHÔNG vào, hiện báo từ chối và cho xin mã mới', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/recover');
  const owner = await createOwner();
  await page.getByRole('button', { name: 'Thiết bị cũ duyệt' }).click();
  await page.getByRole('button', { name: 'Hiện mã ghép' }).click();
  await page.locator('.pairbox .pcode').first().waitFor();
  const pairingCode = (await page.locator('.pairbox .pcode').nth(0).textContent()) ?? '';
  const denied = await api('POST', '/api/device-links/deny', owner.token, { pairingCode });
  assert.equal(denied.status < 300, true);
  await page.getByText('Thiết bị cũ đã từ chối yêu cầu. Hiện mã mới để thử lại.').waitFor();
  assert.equal(await tokenOf(page), null, 'không nhận phiên');
  assert.equal((await devicesOf(owner.token)).length, 1);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('máy bị thu hồi từ thiết bị khác: mở lại thấy "Phiên đã hết" và dẫn tới "Mở trên máy này"; bí mật phiên cũ được quên', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner({ withCode: true });
  const tablet = await addDevice(owner.token, 'Máy tính bảng');
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/security`);
  await page.locator('.devrow').nth(1).waitFor(); // đã nạp xong và ghi nhớ "còn mã + còn thiết bị khác"
  const phoneDevice = (await devicesOf(owner.token)).find((d) => d.current);
  assert.ok(phoneDevice);
  assert.equal((await api('DELETE', `/api/sessions/${phoneDevice.id}`, tablet)).status < 300, true);
  await page.reload();
  await page.getByRole('heading', { name: 'Phiên đã hết' }).waitFor();
  await page.getByRole('button', { name: 'Mở trên máy này' }).click();
  await page.getByRole('heading', { name: 'Mở chuyến đi trên máy này' }).waitFor();
  assert.equal(await tokenOf(page), null);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('đổi tên thiết bị này ở Cài đặt: lưu ở máy chủ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/trips');
  const owner = await createOwner();
  await loginAs(page, owner.token);
  await page.goto(`${baseUrl}/#/settings`);
  await page.getByRole('textbox').first().fill('Điện thoại của tôi');
  await page.getByRole('button', { name: /^Lưu/ }).first().click();
  await page.getByRole('status').first().waitFor();
  assert.equal((await devicesOf(owner.token))[0]?.name, 'Điện thoại của tôi');
  assert.deepEqual(errors, []);
  await ctx.close();
});
