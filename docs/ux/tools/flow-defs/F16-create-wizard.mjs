// F16 (DG-2 A3, DR-012 Q8): tạo chuyến theo bước (KHUNG, bản thử): Đi đâu → Khi nào → Ai đi → Sở thích → Ngân sách → Xem lại.
// "Ai đi" chỉ là kiểu chuyến đi; "ngày linh hoạt" dùng lại "Dự kiến N ngày" (không quyết A3).
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F16',
  title: 'tạo chuyến theo bước (khung): kiểm lỗi từng bước, Quay lại giữ dữ liệu, tạo xong có kiểu và sở thích',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-act="wizard"]').click();
    await page.locator('#wz-h').waitFor();
    const bar = page.locator('#panel .obar');

    // ---- A. Bước 1: nhãn BẢN THỬ, điểm đến thật, sắp ra mắt; tiến độ 1/6 ----
    assert.equal(await txt(page.locator('#wz-h')), 'Đi đâu', 'bước 1');
    assert.match(await txt(page.locator('#panel')), /BẢN THỬ/, 'gắn nhãn khung, chưa chốt dữ liệu');
    assert.match(await txt(page.locator('#panel')), /Hà Giang/, 'điểm đến thật');
    assert.match(await txt(page.locator('#panel')), /Sắp ra mắt/, 'điểm đến chưa có dữ liệu nói rõ là sắp ra mắt');
    assert.equal(await bar.getAttribute('aria-valuenow'), '1', 'tiến độ 1');
    assert.equal(await bar.getAttribute('aria-valuemax'), '6', 'tổng 6 bước');
    assert.equal(await page.locator('[data-act="wzBack"]').count(), 0, 'bước 1 chưa có Quay lại');
    await page.locator('[data-act="wzNext"]').click();

    // ---- B. Bước 2: kiểm ngày ngay tại bước; Dự kiến N ngày (không quyết A3) ----
    assert.equal(await txt(page.locator('#wz-h')), 'Khi nào', 'bước 2');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.id), 'wz-h', 'focus về tiêu đề bước');
    await page.locator('#w-end').fill('2000-01-01');
    await page.locator('[data-act="wzNext"]').click();
    assert.match(await txt(page.locator('#w-err')), /Ngày về phải sau hoặc bằng ngày đi/, 'ngày về trước ngày đi: lỗi tại bước, không sang bước sau');
    assert.equal(await txt(page.locator('#wz-h')), 'Khi nào', 'vẫn ở bước 2');
    const start = await page.locator('#w-start').inputValue();
    await page.locator('#w-end').fill(start);
    await page.locator('#w-tent').check();
    assert.equal(await page.locator('#w-n-wrap').isVisible(), true, 'hiện ô Dự kiến số ngày');
    assert.equal(await page.locator('#w-end').isVisible(), false, 'ẩn Ngày về khi dự kiến');
    await page.locator('#w-n').fill('0');
    await page.locator('[data-act="wzNext"]').click();
    assert.match(await txt(page.locator('#w-err')), /từ 1 đến 366/, 'số ngày dự kiến sai');
    await page.locator('#w-n').fill('4');
    await page.locator('[data-act="wzNext"]').click();

    // ---- C. Bước 3, 4: kiểu chuyến đi (chọn một, bỏ chọn được), sở thích (nhiều) ----
    assert.equal(await txt(page.locator('#wz-h')), 'Ai đi', 'bước 3');
    assert.match(await txt(page.locator('#panel')), /chưa phải danh sách người đi cùng/, 'nói rõ "ai đi" chưa phải thành viên');
    await page.locator('[data-wz-kind="Bạn bè"]').click();
    await page.locator('[data-wz-kind="Gia đình"]').click();
    assert.equal(await page.locator('[data-wz-kind="Bạn bè"]').getAttribute('aria-pressed'), 'false', 'chọn một: kiểu cũ bỏ chọn');
    assert.equal(await page.locator('[data-wz-kind="Gia đình"]').getAttribute('aria-pressed'), 'true', 'kiểu mới được chọn');
    await page.locator('[data-act="wzNext"]').click();
    assert.equal(await txt(page.locator('#wz-h')), 'Sở thích', 'bước 4');
    await page.locator('[data-wz-int="canh"]').click();
    await page.locator('[data-wz-int="am"]').click();
    await page.locator('[data-act="wzNext"]').click();

    // ---- D. Bước 5: ngân sách kiểm lỗi, gợi ý đổi ra VND ----
    assert.equal(await txt(page.locator('#wz-h')), 'Ngân sách', 'bước 5');
    await page.locator('#s-budget').fill('-5');
    await page.locator('[data-act="wzNext"]').click();
    assert.match(await txt(page.locator('#w-err')), /Ngân sách chỉ nhập số nguyên/, 'ngân sách âm bị chặn');
    await page.locator('#s-budget').fill('3000');
    assert.ok((await page.locator('#s-budget').locator('..').locator('.hint').textContent()).includes('= 3.000.000'), 'gợi ý đổi ra VND');
    await page.locator('[data-act="wzNext"]').click();

    // ---- E. Bước 6: Xem lại; Quay lại giữ dữ liệu đã nhập ----
    assert.equal(await txt(page.locator('#wz-h')), 'Xem lại', 'bước 6');
    const sum = await txt(page.locator('.wzsum'));
    assert.match(sum, /Gia đình/, 'tóm tắt kiểu chuyến đi');
    assert.match(sum, /Cảnh quan, Ẩm thực/, 'tóm tắt sở thích');
    assert.match(sum, /dự kiến 4 ngày/, 'tóm tắt ngày dự kiến');
    assert.match(sum, /3\.000\.000/, 'tóm tắt ngân sách');
    assert.equal(await txt(page.locator('[data-act="wzNext"]')), 'Tạo chuyến đi', 'bước cuối đổi nhãn nút');
    await page.locator('[data-act="wzBack"]').click();
    assert.equal(await page.locator('#s-budget').inputValue(), '3000', 'Quay lại giữ ngân sách');
    await page.locator('[data-act="wzBack"]').click();
    assert.equal(await page.locator('[data-wz-int="canh"]').getAttribute('aria-pressed'), 'true', 'Quay lại giữ sở thích');
    await page.locator('[data-act="wzNext"]').click();
    await page.locator('[data-act="wzNext"]').click();
    await page.locator('#w-name').fill('');
    await page.locator('[data-act="wzNext"]').click();
    assert.match(await txt(page.locator('#w-err')), /đặt tên/, 'tên rỗng bị chặn');
    await page.locator('#w-name').fill('Chuyến thử theo bước');

    // ---- F. Tạo: vào chuyến mới với kiểu + sở thích (danh tính mẫu đã có; luồng người mới lưu lần đầu là F02) ----
    await page.locator('[data-act="wzNext"]').click();
    await page.locator('.mapbox').waitFor();
    const s = await st();
    const t = s.trips.find((x) => x.name === 'Chuyến thử theo bước');
    assert.ok(t, 'chuyến đã được tạo');
    assert.equal(t.kind, 'Gia đình', 'lưu kiểu chuyến đi');
    assert.deepEqual(t.interests, ['canh', 'am'], 'lưu sở thích');
    assert.equal(t.tentative, true, 'ngày dự kiến có cờ');
    assert.equal(t.budget, 3000, 'ngân sách');
    assert.deepEqual(t.styles, [], 'kiểu chuyến đi và sở thích KHÔNG trộn vào "phong cách" (styles)');
    assert.match(await txt(page.locator('.tbody .chips', { hasText: 'Kiểu:' })), /Kiểu: Gia đình.*Cảnh quan.*Ẩm thực/, 'chip riêng cho kiểu và sở thích ở Tổng quan');

    // ---- G. Tuyến theo ngày (A4, khung): chuyến mới chưa có địa điểm → "chưa có tuyến", bấm chip sang đúng ngày ----
    await page.locator('.dayroutes').waitFor();
    assert.equal(await page.locator('.dayroutes .dchip').count(), 4, 'mỗi ngày một chip (dự kiến 4 ngày)');
    assert.match(await txt(page.locator('.dayroutes .dchip').first()), /Ngày 1 · chưa có tuyến/, 'chưa có địa điểm: nói thật là chưa có tuyến');
    await page.locator('.dayroutes .dchip').nth(1).click();
    assert.match(await txt(page.locator('.daysec h2').first()), /Ngày 2/, 'bấm chip sang đúng ngày');

    // ---- H. Hủy giữa chừng trả focus về nút đã mở trình tạo (vẽ lại từng bước không làm mất nút) ----
    await page.locator('.mapbox [data-go="trips"]').click();
    await page.locator('[data-act="wizard"]').waitFor();
    await page.locator('[data-act="wizard"]').focus();
    await page.locator('[data-act="wizard"]').click();
    await page.locator('#wz-h').waitFor();
    await page.locator('[data-act="wzNext"]').click();
    await page.locator('[data-act="wzNext"]').click();
    await page.locator('#panel [data-act="closeSheet"]').click();
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-act')), 'wizard', 'focus trả về nút Tạo từng bước');
  },
};
