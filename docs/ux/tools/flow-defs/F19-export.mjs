// F19 (DG-2 A8): xuất/chia sẻ (khung): xem trước Ảnh/PDF/Lịch bằng dữ liệu chuyến thật, nói thật là chưa tạo tệp.
export default {
  id: 'F19',
  title: 'xuất: xem trước Ảnh, PDF, Lịch từ dữ liệu chuyến; nút tạo tệp tắt; không bịa',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    await page.locator('.mapbox [data-act="shareSheet"]').click();
    await page.locator('[data-act="exportStub"][data-what="PDF"]').click();
    await page.locator('h1', { hasText: 'Lưu hoặc gửi lịch trình' }).waitFor();

    // ---- A. PDF: bảng ngày/giờ/mục/chi phí; tổng chỉ cộng mục đã biết giá ----
    assert.equal(await page.locator('[data-export-kind="PDF"]').getAttribute('aria-pressed'), 'true', 'đúng kiểu đã chọn');
    assert.ok(await page.locator('.xpaper tbody tr').count() >= 3, 'bảng có các dòng mục');
    assert.match(await txt(page.locator('.xpaper')), /Tổng phải trả thêm \(đã biết giá\)/, 'tổng nói rõ chỉ cộng đã biết giá');
    assert.match(await txt(page.locator('.xpaper')), /chỉ là ước tính/, 'ước tính có nhãn');
    assert.equal(await page.locator('.xpaper th[scope="col"]').count(), 4, 'bảng có tiêu đề cột đúng chuẩn');

    // ---- B. Ảnh: thẻ theo ngày, màu ngày kèm chữ "Ngày n"; không logo/liên kết ngoài ----
    await page.locator('[data-export-kind="Ảnh"]').click();
    assert.ok(await page.locator('.xday').count() >= 3, 'mỗi ngày một khối');
    assert.match(await txt(page.locator('.xday').first()), /Ngày 1/, 'tên ngày bằng chữ, không chỉ màu');
    assert.equal(await page.locator('.xcard a').count(), 0, 'không có liên kết ngoài trong ảnh');
    assert.match(await txt(page.locator('.xcard')), /bản xem trước/, 'chân thẻ nói là xem trước');

    // ---- C. Lịch: sự kiện theo ngày; mục không giờ là cả ngày; múi giờ thiết bị ----
    await page.locator('[data-export-kind="Lịch"]').click();
    assert.ok(await page.locator('.xcal li').count() >= 3, 'có các sự kiện');
    assert.match(await txt(page.locator('.xcal')), /Cả ngày/, 'mục không có giờ là cả ngày');
    assert.match(await txt(page.locator('#screen')), /múi giờ của thiết bị/, 'nói rõ múi giờ');

    // ---- D. Nói thật: nút tạo tệp tắt, có lời giải thích; liên kết chỉ-đọc thuộc 1b ----
    assert.equal(await page.locator('button:has-text("Tạo tệp (chưa làm)")').isDisabled(), true, 'nút tạo tệp tắt');
    assert.match(await txt(page.locator('.warnbox')), /Liên kết chỉ-đọc thuộc phần nhóm \(1b\), chưa quyết/, 'liên kết chỉ-đọc là 1b');
    assert.equal(await page.locator('#xwhy').count(), 1, 'có lời giải thích gắn với nút tắt');

    // ---- E. Chuyến chưa chắc ngày (A3 chờ PO): cảnh báo ngày dự kiến, KHÔNG tạo lịch cho ngày chưa chắc ----
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.trips[0].tentative = true; localStorage.setItem(k, JSON.stringify(s)); }, 'wander-kham-pha-proto-v8');
    await page.reload();
    await page.locator('h1', { hasText: 'Lưu hoặc gửi lịch trình' }).waitFor();
    assert.match(await txt(page.locator('.warnbox').first()), /chưa chắc ngày/, 'cảnh báo ngày chỉ là dự kiến');
    await page.locator('[data-export-kind="Lịch"]').click();
    assert.match(await txt(page.locator('.empty')), /Chưa thể thêm vào lịch/, 'không tạo sự kiện cho ngày chưa chắc');
  },
};
