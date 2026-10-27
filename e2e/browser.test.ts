// Kiểm thử đầu-cuối trên trình duyệt thật (Edge hoặc Chrome đã cài), khung nhìn điện thoại.
// Chạy qua `tools\dev.ps1 e2e` (backend Java + web/dist, đặt WANDER_BASE_URL). Các test này kiểm tra luồng người dùng của Lát 1a; KHÔNG xác minh G7.
import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import type { Browser, BrowserContext, Page } from 'playwright-core';

let browser: Browser;
let baseUrl = '';

test.before(async () => {
  const external = process.env['WANDER_BASE_URL'];
  if (!external) {
    throw new Error('Cần đặt WANDER_BASE_URL (backend Java đang chạy, phục vụ cả web/dist). Dùng `tools\\dev.ps1 e2e`.');
  }
  // Backend Java (Spring Boot) đã chạy sẵn và phục vụ cả giao diện web/dist (tools/dev.ps1 e2e).
  baseUrl = external.replace(/\/$/, '');
  let launchError: unknown;
  for (const channel of ['msedge', 'chrome'] as const) {
    try {
      browser = await chromium.launch({ channel, headless: true });
      return;
    } catch (e) {
      launchError = e;
    }
  }
  throw new Error(`Không mở được trình duyệt (cần Edge hoặc Chrome): ${String(launchError)}`);
});

test.after(async () => {
  await browser?.close();
});

async function newDevice(): Promise<{ ctx: BrowserContext; page: Page; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'vi-VN' });
  const page = await ctx.newPage();
  page.on('dialog', (d) => void d.accept());
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  return { ctx, page, errors };
}

/** Tạo danh tính, tạo và xác nhận mã khôi phục; trả về mã. */
async function onboard(page: Page): Promise<string> {
  await page.goto(baseUrl + '/');
  await page.getByRole('button', { name: 'Bắt đầu lập kế hoạch' }).click();
  await page.getByRole('button', { name: 'Tạo mã khôi phục' }).click();
  const code = (await page.getByTestId('code').textContent())!.trim();
  assert.match(code, /^([0-9A-Z]{5}-){5}[0-9A-Z]{5}$/);
  await page.getByLabel('Nhập lại mã để xác nhận').fill(code);
  await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await page.getByText('Mã khôi phục đã có hiệu lực').waitFor();
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
  // Sau khi tạo danh tính, trang đầu là Khám phá; các luồng chuyến đi mở tab "Chuyến đi".
  await page.getByRole('link', { name: 'Chuyến đi' }).click();
  await page.getByRole('heading', { name: 'Các chuyến của bạn' }).waitFor();
  return code;
}

async function createTrip(page: Page) {
  await page.getByRole('button', { name: 'Tạo chuyến mới' }).click();
  await page.getByLabel('Tên chuyến').fill('Hà Giang – Tà Xùa');
  await page.getByLabel('Điểm đến').fill('Hà Giang');
  await page.getByLabel('Ngày đi').fill('2026-08-29');
  await page.getByLabel('Ngày về').fill('2026-09-06');
  await page.getByRole('button', { name: 'Tạo chuyến', exact: true }).click();
  await page.getByText('9 ngày').waitFor();
}

const titles = (page: Page, day: string) => page.getByRole('region', { name: day }).locator('.itemtitle strong').allTextContents();

test('đường chính: tạo chuyến, thêm mục, tổng tiền, sắp xếp, xóa và Hoàn tác', async () => {
  const { ctx, page, errors } = await newDevice();
  try {
    // D26: nhập sai mã xác nhận thì bị từ chối (xem onboard cho đường đúng)
    await page.goto(baseUrl + '/');
    await page.getByRole('button', { name: 'Bắt đầu lập kế hoạch' }).click();
    await page.getByRole('button', { name: 'Tạo mã khôi phục' }).click();
    await page.getByLabel('Nhập lại mã để xác nhận').fill('SAI-MA');
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.match((await page.getByRole('alert').textContent())!, /chưa khớp/);
    await page.getByLabel('Nhập lại mã để xác nhận').fill((await page.getByTestId('code').textContent())!.trim());
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await page.getByRole('button', { name: 'Tiếp tục' }).click();
    await page.getByRole('link', { name: 'Chuyến đi' }).click();

    await createTrip(page);
    // A-2: 9 ngày, ngày đầu là T7 29/08
    assert.equal(await page.locator('section.day').count(), 9);
    await page.getByRole('heading', { name: 'Ngày 1 · T7 29/08' }).waitFor();
    assert.match((await page.getByTestId('total').textContent())!, /0 ₫/);

    const day2 = page.getByRole('region', { name: 'Ngày 2' });
    await day2.getByRole('button', { name: '+ Thêm mục' }).click();
    await day2.getByLabel('Tiêu đề').fill('Cột cờ Lũng Cú');
    await day2.getByRole('button', { name: 'Thêm chi tiết' }).click();
    await day2.getByLabel('Chi phí').fill('150');
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByText('150.000 ₫').first().waitFor();
    assert.match((await page.getByTestId('total').textContent())!, /150\.000 ₫/);

    // R3: chi phí âm bị chặn, tổng không đổi
    await day2.getByLabel('Tiêu đề').fill('Phở');
    await day2.getByLabel('Chi phí').fill('-5');
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByRole('alert').waitFor();
    assert.match((await day2.getByRole('alert').textContent())!, /không được âm/);
    // sửa lại: chi phí trống = chưa rõ giá
    await day2.getByLabel('Chi phí').fill('');
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByText('Chưa rõ giá').waitFor();
    // D18: đã bao gồm không cộng vào tổng
    await day2.getByLabel('Tiêu đề').fill('Bữa sáng khách sạn');
    await day2.getByLabel('Chi phí').fill('0');
    await day2.getByLabel('Đã bao gồm').check();
    await day2.getByLabel('Giá tham khảo').fill('80');
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByText('Đã bao gồm · tham khảo 80.000 ₫').waitFor();
    await day2.getByRole('button', { name: 'Xong' }).click();
    assert.match((await page.getByTestId('total').textContent())!, /150\.000 ₫/);
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Cột cờ Lũng Cú', 'Phở', 'Bữa sáng khách sạn']);

    // D16: sắp xếp thủ công, giữ nguyên sau khi tải lại
    await day2.getByRole('button', { name: 'Đưa «Bữa sáng khách sạn» lên' }).click();
    await page.waitForFunction(() => document.querySelectorAll('section.day')[1]?.querySelectorAll('.itemtitle strong')[1]?.textContent === 'Bữa sáng khách sạn');
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Cột cờ Lũng Cú', 'Bữa sáng khách sạn', 'Phở']);
    await page.reload();
    await page.getByText('9 ngày').waitFor();
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Cột cờ Lũng Cú', 'Bữa sáng khách sạn', 'Phở']);

    // A-8: xóa mềm, Hoàn tác, Đã xóa gần đây, khôi phục
    await day2.getByRole('button', { name: 'Xóa «Cột cờ Lũng Cú»' }).click();
    await page.getByRole('status').waitFor();
    // Thông báo Hoàn tác hiện trước khi danh sách tải lại xong: chờ lịch cập nhật rồi mới kiểm tra.
    await page.waitForFunction(() => document.querySelectorAll('section.day')[1]?.querySelectorAll('.itemtitle strong').length === 2);
    assert.doesNotMatch((await page.getByTestId('total').textContent())!, /150\.000 ₫/);
    assert.match((await page.getByTestId('total').textContent())!, /(^|\D)0 ₫/);
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Bữa sáng khách sạn', 'Phở']);
    await page.getByRole('button', { name: 'Hoàn tác' }).click();
    await page.getByText('150.000 ₫').first().waitFor();
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Cột cờ Lũng Cú', 'Bữa sáng khách sạn', 'Phở']);

    await day2.getByRole('button', { name: 'Xóa «Phở»' }).click();
    await page.getByRole('button', { name: /Đã xóa gần đây \(1\)/ }).click();
    await page.getByRole('button', { name: 'Khôi phục' }).click();
    await page.getByRole('button', { name: /Đã xóa gần đây \(0\)/ }).waitFor();
    assert.deepEqual(await titles(page, 'Ngày 2'), ['Cột cờ Lũng Cú', 'Bữa sáng khách sạn', 'Phở']);

    // R12: đổi ngày chuyến làm mục nằm ngoài khoảng thì bị chặn kèm giải thích
    await page.getByRole('button', { name: 'Sửa chuyến' }).click();
    await page.getByLabel('Ngày đi').fill('2026-08-31');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.getByRole('alert').first().waitFor();
    // Chỉ chấp nhận các phản hồi 400/409 do chính kịch bản này cố ý gây ra (mã sai, chi phí âm, đổi ngày bị R12 chặn).
    assert.deepEqual(
      errors.filter((e) => !/Failed to load resource: the server responded with a status of (400|409)/.test(e)),
      [],
    );
  } finally {
    await ctx.close();
  }
});

test('mở trên thiết bị khác bằng mã khôi phục (KP-C); thiết bị cũ không bị thu hồi', async () => {
  const a = await newDevice();
  const b = await newDevice();
  try {
    const code = await onboard(a.page);
    await createTrip(a.page);
    await a.page.getByRole('region', { name: 'Ngày 3' }).getByRole('button', { name: '+ Thêm mục' }).click();
    await a.page.getByRole('region', { name: 'Ngày 3' }).getByLabel('Tiêu đề').fill('Đèo Mã Pì Lèng');
    await a.page.getByRole('region', { name: 'Ngày 3' }).getByRole('button', { name: 'Thêm', exact: true }).click();
    await a.page.getByText('Đèo Mã Pì Lèng').waitFor();

    await b.page.goto(baseUrl + '/#/recover');
    await b.page.getByLabel('Mã khôi phục').fill(code);
    await b.page.getByRole('button', { name: 'Tiếp tục' }).click();
    const replacement = (await b.page.getByTestId('code').textContent())!.trim();
    assert.notEqual(replacement, code);
    // không có cách bỏ qua: nhập sai thì không hoàn tất
    await b.page.getByLabel('Nhập lại mã mới').fill('SAI');
    await b.page.getByRole('button', { name: 'Hoàn tất khôi phục' }).click();
    await b.page.getByRole('alert').waitFor();
    await b.page.getByLabel('Nhập lại mã mới').fill(replacement);
    await b.page.getByRole('button', { name: 'Hoàn tất khôi phục' }).click();
    await b.page.getByRole('heading', { name: 'Các chuyến của bạn' }).waitFor();
    await b.page.getByText('Hà Giang – Tà Xùa').click();
    await b.page.getByText('Đèo Mã Pì Lèng').waitFor();

    // mã cũ đã hết hiệu lực
    const c = await newDevice();
    try {
      await c.page.goto(baseUrl + '/#/recover');
      await c.page.getByLabel('Mã khôi phục').fill(code);
      await c.page.getByRole('button', { name: 'Tiếp tục' }).click();
      await c.page.getByRole('alert').waitFor();
      assert.match((await c.page.getByRole('alert').textContent())!, /không đúng hoặc đã được dùng/);
    } finally {
      await c.ctx.close();
    }

    // thiết bị cũ vẫn đăng nhập và thấy 2 thiết bị
    await a.page.goto(baseUrl + '/#/security');
    await a.page.getByText('Thiết bị này').waitFor();
    assert.equal(await a.page.getByRole('button', { name: 'Thu hồi' }).count(), 1);
  } finally {
    await a.ctx.close();
    await b.ctx.close();
  }
});

test('thiết bị tin cậy duyệt thiết bị mới; thu hồi phiên có hiệu lực ngay', async () => {
  const a = await newDevice();
  const b = await newDevice();
  try {
    await onboard(a.page);
    await createTrip(a.page);

    await b.page.goto(baseUrl + '/#/recover');
    await b.page.getByRole('tab', { name: 'Duyệt từ thiết bị khác' }).click();
    await b.page.getByRole('button', { name: 'Tạo mã ghép' }).click();
    const pairing = (await b.page.getByTestId('code').textContent())!.trim();

    await a.page.goto(baseUrl + '/#/security');
    await a.page.getByLabel('Mã ghép từ thiết bị mới').fill(pairing);
    await a.page.getByRole('button', { name: 'Duyệt thiết bị mới' }).click();
    await a.page.getByText('Đã duyệt thiết bị mới.').waitFor();

    await b.page.getByRole('heading', { name: 'Các chuyến của bạn' }).waitFor({ timeout: 15000 });
    await b.page.getByText('Hà Giang – Tà Xùa').waitFor();

    // A thu hồi thiết bị B → B mất quyền ở yêu cầu kế tiếp
    await a.page.reload();
    await a.page.getByRole('button', { name: 'Thu hồi' }).click();
    await a.page.getByRole('button', { name: 'Thu hồi' }).waitFor({ state: 'detached' });
    await b.page.reload();
    await b.page.getByText('Phiên không còn hiệu lực').waitFor();
  } finally {
    await a.ctx.close();
    await b.ctx.close();
  }
});

test('A-13/A-16: tổng theo ngày và loại; việc cần làm chưa xong tick được từ danh sách', async () => {
  const { ctx, page, errors } = await newDevice();
  try {
    await onboard(page);
    await createTrip(page);
    const add = async (day: string, title: string, type: string, cost?: string) => {
      const region = page.getByRole('region', { name: day });
      await region.getByRole('button', { name: '+ Thêm mục' }).click();
      await region.getByRole('radio', { name: type, exact: true }).click();
      await region.getByLabel('Tiêu đề').fill(title);
      if (cost !== undefined) {
        await region.getByRole('button', { name: 'Thêm chi tiết' }).click();
        await region.getByLabel('Chi phí').fill(cost);
      }
      await region.getByRole('button', { name: 'Thêm', exact: true }).click();
      await region.getByText(title).first().waitFor();
      await region.getByRole('button', { name: 'Xong' }).click();
    };
    await add('Ngày 2', 'Phở bò', 'Ăn uống', '60');
    await add('Ngày 2', 'Homestay', 'Lưu trú', '400');
    await add('Ngày 3', 'Bún chả', 'Ăn uống', '40');
    await add('Ngày 3', 'In vé tàu', 'Việc cần làm');

    await page.getByText('Tổng theo ngày và theo loại').click();
    const byType = await page.getByTestId('by-type').innerText();
    assert.match(byType, /Ăn uống\s+100\.000 ₫/);
    assert.match(byType, /Lưu trú\s+400\.000 ₫/);
    const byDay = await page.getByTestId('by-day').innerText();
    assert.match(byDay, /Ngày 2 · 30\/08\s+460\.000 ₫/);
    assert.match(byDay, /Ngày 3 · 31\/08\s+40\.000 ₫/);
    assert.match((await page.getByTestId('total').textContent())!, /500\.000 ₫/);

    const pending = page.getByTestId('pending-tasks');
    await pending.getByText('In vé tàu').waitFor();
    await pending.getByRole('checkbox', { name: 'Hoàn thành: In vé tàu' }).click();
    await pending.waitFor({ state: 'detached' });
    assert.equal(await page.getByRole('region', { name: 'Ngày 3' }).getByRole('checkbox', { name: 'Hoàn thành: In vé tàu' }).isChecked(), true);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('A-14: trạng thái đặt chỗ — mặc định "Chờ xác nhận", đổi sang "Đã đặt", giữ sau khi tải lại; Nghỉ không có', async () => {
  const { ctx, page, errors } = await newDevice();
  try {
    await onboard(page);
    await createTrip(page);
    const day2 = page.getByRole('region', { name: 'Ngày 2' });
    await day2.getByRole('button', { name: '+ Thêm mục' }).click();
    await day2.getByLabel('Tiêu đề').fill('Khách sạn Đồng Văn');
    await day2.getByRole('radio', { name: 'Lưu trú' }).click();
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByTestId('booking').waitFor();
    assert.equal((await day2.getByTestId('booking').textContent())!.trim(), 'Chờ xác nhận');

    // Nghỉ không có trạng thái đặt chỗ
    await day2.getByLabel('Tiêu đề').fill('Nghỉ trưa');
    await day2.getByRole('radio', { name: 'Nghỉ' }).click();
    await day2.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day2.getByText('Nghỉ trưa').waitFor();
    await day2.getByRole('button', { name: 'Xong' }).click();
    assert.equal(await day2.getByTestId('booking').count(), 1);

    await day2.getByRole('button', { name: /Đặt chỗ «Khách sạn Đồng Văn»/ }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="booking"]')?.textContent?.trim() === 'Đã đặt');
    await page.reload();
    await page.getByText('9 ngày').waitFor();
    assert.equal((await day2.getByTestId('booking').textContent())!.trim(), 'Đã đặt');
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('Q11: tùy chọn chuyến đi — ngân sách so với tổng (chưa gồm mục chưa rõ giá), kiểu và nhịp là nhãn; xóa ngân sách được', async () => {
  const { ctx, page, errors } = await newDevice();
  try {
    await onboard(page);
    await page.getByRole('button', { name: 'Tạo chuyến mới' }).click();
    await page.getByLabel('Tên chuyến').fill('Phú Quốc');
    await page.getByLabel('Điểm đến').fill('Phú Quốc');
    await page.getByLabel('Ngày đi').fill('2026-12-01');
    await page.getByLabel('Ngày về').fill('2026-12-03');
    await page.getByLabel('Ngân sách dự kiến').fill('1000');
    await page.getByRole('checkbox', { name: 'Biển' }).click();
    await page.getByRole('checkbox', { name: 'Gia đình' }).click();
    await page.getByRole('radio', { name: 'Vừa' }).click();
    await page.getByRole('button', { name: 'Tạo chuyến', exact: true }).click();
    await page.getByText('3 ngày').waitFor();

    const labels = (await page.getByTestId('trip-labels').textContent())!;
    assert.match(labels, /Biển/);
    assert.match(labels, /Gia đình/);
    assert.match(labels, /Nhịp vừa/);
    assert.match((await page.getByTestId('budget').textContent())!, /1\.000\.000 ₫.*Còn lại 1\.000\.000 ₫/);

    const day1 = page.getByRole('region', { name: 'Ngày 1' });
    await day1.getByRole('button', { name: '+ Thêm mục' }).click();
    await day1.getByLabel('Tiêu đề').fill('Resort');
    await day1.getByRole('button', { name: 'Thêm chi tiết' }).click();
    await day1.getByLabel('Chi phí').fill('400');
    await day1.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day1.getByText('400.000 ₫').first().waitFor();
    await page.getByText('Còn lại 600.000 ₫').waitFor();

    // mục chưa rõ giá không bị coi là 0: ghi rõ "chưa gồm 1 mục chưa rõ giá"
    await day1.getByLabel('Tiêu đề').fill('Hải sản');
    await day1.getByLabel('Chi phí').fill('');
    await day1.getByRole('button', { name: 'Thêm', exact: true }).click();
    await day1.getByText('Chưa rõ giá').waitFor();
    await page.getByText(/Còn lại 600\.000 ₫ \(chưa gồm 1 mục chưa rõ giá\)/).waitFor();

    await day1.getByLabel('Tiêu đề').fill('Thuê xe máy');
    await day1.getByLabel('Chi phí').fill('800');
    await day1.getByRole('button', { name: 'Thêm', exact: true }).click();
    await page.getByText(/Đã vượt ngân sách 200\.000 ₫/).waitFor();
    await day1.getByRole('button', { name: 'Xong' }).click();

    // xóa ngân sách: khối ngân sách biến mất, kiểu và nhịp giữ nguyên
    await page.getByRole('button', { name: 'Sửa chuyến' }).click();
    await page.getByLabel('Ngân sách dự kiến').fill('');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.getByTestId('budget').waitFor({ state: 'detached' });
    assert.match((await page.getByTestId('trip-labels').textContent())!, /Biển/);

    // nhãn cũng hiện trên danh sách chuyến
    await page.getByRole('link', { name: '← Các chuyến' }).click();
    await page.getByTestId('trip-list-labels').waitFor();
    assert.match((await page.getByTestId('trip-list-labels').textContent())!, /Biển · Gia đình · nhịp vừa/);
    assert.deepEqual(errors, []);
  } finally {
    await ctx.close();
  }
});

test('khám phá: tìm Hà Giang, cẩm nang, quẹt chọn, xem nhiều ảnh trong chi tiết, thấy trong Đã chọn (ADR-009/010, DR-007)', async () => {
  const { ctx, page, errors } = await newDevice();
  try {
    await onboard(page);
    await page.getByRole('link', { name: 'Khám phá' }).click();
    // tìm không dấu
    await page.getByLabel('Tìm điểm đến').fill('ha giang');
    await page.locator('a.dcard').waitFor();
    assert.equal(await page.locator('a.dcard').count(), 1);
    await page.getByLabel('Tìm điểm đến').fill('xyz không có');
    await page.locator('a.dcard').waitFor({ state: 'detached' });
    await page.getByLabel('Tìm điểm đến').fill('');
    await page.locator('a.dcard').click();

    // cẩm nang: mở khối "Chuẩn bị mang gì", đánh dấu một món
    await page.getByRole('heading', { name: 'Cẩm nang Hà Giang' }).waitFor();
    await page.getByRole('button', { name: /Chuẩn bị mang gì/ }).click();
    const pack = page.getByRole('button', { name: 'Thuốc say xe', exact: true });
    await pack.click();
    assert.equal(await pack.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByText('Cháo ấu tẩu').count(), 0); // món có rủi ro an toàn đã bị loại

    // bộ thẻ: ảnh thật, không có thẻ ảnh hỏng
    await page.getByRole('link', { name: 'Bắt đầu quẹt' }).click();
    const front = page.locator('.dk-card.front');
    await front.waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector<HTMLImageElement>('.dk-card.front img.ph');
      return !!img && img.complete && img.naturalWidth > 0;
    });
    const name = (await front.locator('h2').textContent())!.trim();
    assert.ok(name.length > 0);

    // chi tiết: nhiều ảnh, đổi ảnh bằng nút, nhãn biên tập, không có số sao
    await front.getByRole('button', { name: 'Xem chi tiết' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const counter = dialog.locator('.gcount');
    const total = Number((await counter.textContent())!.split('/')[1]!.trim());
    assert.ok(total >= 2, 'địa điểm cần từ 2 ảnh để thử đổi ảnh');
    await dialog.getByRole('button', { name: 'Ảnh sau' }).click();
    await page.waitForFunction(() => document.querySelector('.gcount')?.textContent?.startsWith('2'));
    await dialog.getByText('Wander gợi ý').waitFor();
    assert.match((await dialog.textContent())!, /Nên ghé|Đáng đi|Chỉ ghé nếu tiện/);
    assert.equal(await dialog.getByText('★').count(), 0); // nhãn biên tập, không có điểm sao (DR-007)
    // nguồn ảnh qua nút ⓘ
    await dialog.getByRole('button', { name: 'Nguồn ảnh' }).click();
    await dialog.getByText(/Ảnh: .+ · .+/).waitFor();
    // chọn từ trong chi tiết
    await dialog.getByRole('button', { name: 'Chọn nơi này' }).click();
    await dialog.waitFor({ state: 'detached' });
    await page.getByRole('link', { name: 'Xem đã chọn (1)' }).waitFor();

    // đã chọn: thấy đúng nơi vừa chọn, bỏ chọn được
    await page.getByRole('link', { name: /Xem đã chọn/ }).click();
    await page.getByRole('heading', { name: 'Địa điểm đã chọn' }).waitFor();
    assert.equal(await page.locator('.tile').count(), 1);
    await page.getByRole('button', { name: 'Bỏ chọn ' + name }).click();
    await page.getByText('Chưa chọn nơi nào').waitFor();

    assert.deepEqual(errors, [], 'không có lỗi console hay trang');
  } finally {
    await ctx.close();
  }
});
