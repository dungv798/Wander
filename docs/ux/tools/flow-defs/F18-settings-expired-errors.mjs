// F18 (DG-2 A6/A7): Cài đặt/Giới thiệu (khung), hết phiên hai nhánh, thông báo lỗi theo mã, mở lại onboarding.
export default {
  id: 'F18',
  title: 'Cài đặt: tên thiết bị, giới thiệu lại, hết phiên hai nhánh, lỗi theo mã',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const KEY = 'wander-kham-pha-proto-v8';
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-go="settings"]').click();
    await page.locator('h1', { hasText: 'Cài đặt và giới thiệu' }).waitFor();

    // ---- A. Tên thiết bị: đổi và lưu; trống bị chặn ----
    assert.equal(await page.locator('#st-dev').inputValue(), 'Thiết bị này', 'tên thiết bị hiện tại');
    await page.locator('#st-dev').fill('');
    await page.locator('[data-act="saveDevName"]').click();
    assert.match(await txt(page.locator('#toast')), /nhập tên thiết bị/, 'tên trống bị chặn');
    await page.locator('#st-dev').fill('Điện thoại của Dũng');
    await page.locator('[data-act="saveDevName"]').click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).identity.devices.find((d) => d.current).name, KEY);
    assert.equal(saved, 'Điện thoại của Dũng', 'đã lưu tên thiết bị');

    // ---- B. Nội dung nói thật: quyền riêng tư là bản nháp; chuyến tạo nhầm; nguồn dữ liệu ----
    const t = await txt(page.locator('#screen'));
    assert.match(t, /Bản nháp, chưa phải chính sách pháp lý/, 'riêng tư là bản nháp');
    assert.match(t, /chưa có xóa cả chuyến đi/, 'nói thẳng không xóa được cả chuyến (DR-004)');
    assert.match(t, /Wikimedia Commons/, 'ghi công nguồn dữ liệu');

    // ---- C. Xem lại giới thiệu: mở onboarding, không bắt buộc ----
    await page.locator('[data-act="replayIntro"]').click();
    await page.locator('.obx h1').waitFor();
    assert.equal(await txt(page.locator('.obx h1')), 'Có một nơi đang đợi bạn', 'mở lại từ thẻ 1');
    await page.locator('[data-act="obSkip"]').click();
    await page.locator('.sky, .hero-w').first().waitFor();

    // ---- D. Lỗi theo mã: thông báo tiếng Việt, mã hiển thị, hành động đúng ----
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-go="settings"]').click();
    await page.locator('[data-act="simErr:RATE_LIMITED"]').click();
    await page.locator('#panel [role="alert"]').waitFor();
    assert.match(await txt(page.locator('#panel')), /Bạn thao tác hơi nhanh/, 'RATE_LIMITED có lời tiếng Việt');
    assert.match(await txt(page.locator('#panel code')), /RATE_LIMITED/, 'hiện mã lỗi để hỏi hỗ trợ');
    assert.equal(/\d+ lần/.test(await txt(page.locator('#panel'))), false, 'không đếm lần còn lại (MĐ-8)');
    await page.locator('#panel [data-act="closeSheet"]').first().click();
    await page.locator('[data-act="simErr:STEP_UP_REQUIRED"]').click();
    await page.locator('#panel [data-act="errGo:security"]').click();
    await page.locator('h1', { hasText: 'Bảo mật' }).waitFor();

    // ---- E. Hết phiên: nhánh A (đã có mã) và nhánh B (đã bỏ qua mã, không còn thiết bị tin cậy) ----
    await page.locator('.pagehead [data-go="trips"]').click();
    await page.locator('[data-go="settings"]').click();
    await page.locator('[data-act="simExpire"]').click();
    await page.locator('h1', { hasText: 'Phiên của bạn đã hết hạn' }).waitFor();
    assert.equal(await page.locator('#tabbar').isHidden(), true, 'ẩn thanh tab khi hết phiên');
    assert.match(await txt(page.locator('#screen')), /Bản thử chưa giữ/, 'không hứa giữ chữ khi chưa có cơ chế (skeptic M2)');
    assert.equal(await page.locator('[data-go="recover"]').count(), 1, 'nhánh A: có lối Mở trên máy này');
    await page.locator('[data-act="expBranch:B"]').click();
    assert.match(await txt(page.locator('.warnbox')), /Không khôi phục được chuyến đi này/, 'nhánh B: nói thẳng không khôi phục được (D20, D26), kèm nhãn chờ PO quyết TTL');
    assert.equal(await page.locator('[data-go="recover"]').count(), 0, 'nhánh B: không đưa lối khôi phục vô vọng');
    assert.match(await txt(page.locator('#screen')), /chưa được chốt/, 'không nêu con số thời hạn phiên (Tầng A chưa chốt)');
    assert.equal(/\b\d+\s*(phút|giờ|ngày)\b/.test(await txt(page.locator('.pagehead'))), false, 'không bịa thời hạn');
  },
};
