// F01 (T13): các trạng thái của Khám phá: tìm không ra, ảnh lỗi, hết thẻ, "Về dữ liệu" và ghi nguồn ảnh. Không bịa số liệu: mọi chữ lấy từ catalog thật.
export default {
  id: 'F01',
  title: 'khám phá: tìm không ra, ảnh lỗi, hết thẻ, nguồn dữ liệu',
  size: 390,
  async run({ page, url, assert, newPage }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const noScrollX = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

    // ---- A. Tìm không ra: trạng thái rỗng có lối ra (xóa tìm kiếm), không cụt đường ----
    await page.goto(url + '/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(url + '/');
    await page.locator('#q').fill('Paris');
    await page.locator('#sec .empty').waitFor();
    assert.match(await txt(page.locator('#sec .empty')), /Chưa có điểm đến nào khớp «Paris»/, 'nói rõ tìm gì mà không ra');
    assert.match(await txt(page.locator('#sec .empty')), /Hiện có cẩm nang Hà Giang/, 'nói rõ đang có gì');
    assert.equal(await page.locator('#sec .empty').getAttribute('role'), 'status', 'đọc màn hình nghe được kết quả');
    await page.waitForTimeout(350);   // chờ phần minh họa thu nhỏ
    const eb = await page.locator('#sec .empty h2').boundingBox();
    assert.equal(eb.y + eb.height < 700, true, 'kết quả "không khớp" hiện ngay trong màn hình đầu (không bị đẩy xuống dưới bức minh họa): y=' + Math.round(eb.y));
    await page.locator('[data-act="clearSearch"]').click();
    assert.equal(await page.locator('#q').inputValue(), '', 'xóa tìm kiếm trả ô về rỗng');
    assert.equal(await page.locator('.dcard').count(), 1, 'danh sách điểm đến quay lại');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'q', 'focus trở về ô tìm');
    await page.locator('#q').fill('sa pa');
    assert.match(await txt(page.locator('#sec')), /Sa Pa/, 'tìm không dấu, không phân biệt hoa thường: ra "Sắp ra mắt"');
    assert.equal(await page.locator('.dcard').count(), 0, '"Sa Pa" không có thẻ cẩm nang (chưa làm)');

    // ---- B. Ảnh lỗi (mạng yếu hoặc nguồn ảnh sập): khung giữ nguyên, chữ đọc được, không vỡ bố cục ----
    const bad = await newPage({ size: 390, ignoreConsole: /Failed to load resource/ });   // cố tình chặn ảnh: lỗi tải ảnh là điều kiện thử, mọi lỗi mã vẫn bị bắt
    await bad.route((u) => /\.(jpe?g|png|webp)(\?|$)/i.test(u.pathname) && !/\/app\//.test(u.pathname), (r) => r.abort());
    await bad.goto(url + '/');
    await bad.evaluate(() => localStorage.clear());
    await bad.goto(url + '/');
    await bad.locator('.dcard').waitFor();
    await bad.waitForFunction(() => document.querySelector('.dcard img')?.classList.contains('imgfail'), null, { timeout: 8000 });
    assert.match(await txt(bad.locator('.dcard')), /Hà Giang/, 'ảnh lỗi: tên điểm đến vẫn đọc được');
    const box = await bad.locator('.dcard').boundingBox();
    assert.equal(box.height > 120, true, 'ảnh lỗi: thẻ không bị xẹp (' + Math.round(box.height) + 'px)');
    assert.equal(await bad.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'ảnh lỗi: không cuộn ngang');
    await bad.locator('.dcard').click();
    await bad.locator('[data-go="deck"]').click();
    await bad.locator('.card.front').waitFor();
    assert.match(await txt(bad.locator('.card.front')), /\S{3,}/, 'ảnh lỗi: thẻ quẹt vẫn có tên và mô tả');
    assert.equal(await bad.locator('[data-act="like"]').isEnabled(), true, 'ảnh lỗi: vẫn chọn được địa điểm');
    await bad.close();

    // ---- C. Hết thẻ: có lối đi tiếp và Hoàn tác thẻ cuối ----
    await page.goto(url + '/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(url + '/');
    await page.locator('.dcard').click();
    await page.locator('[data-go="deck"]').click();
    await page.locator('.card.front').waitFor();
    for (let i = 0; i < 40 && (await page.locator('.card.front').count()); i++) {
      const id = await page.locator('.card.front').getAttribute('data-id');
      await page.locator('[data-act="skip"]').first().click();
      await page.waitForFunction((x) => document.querySelector('.card.front')?.dataset.id !== x, id).catch(() => {});
    }
    await page.locator('.empty').waitFor();
    assert.match(await txt(page.locator('.empty')), /Hết thẻ rồi/, 'hết thẻ: nói rõ');
    assert.equal(await page.locator('.empty .btn').count() >= 1, true, 'hết thẻ: có nút đi tiếp');
    assert.equal(await page.locator('[data-act="undo"]').count(), 1, 'hết thẻ: Hoàn tác thẻ cuối');
    assert.equal(await noScrollX(), true, 'không cuộn ngang');

    // ---- D. Về dữ liệu: nguồn ảnh và nhãn biên tập nói thật ----
    await page.goto(url + '/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(url + '/');
    await page.locator('.dcard').click();
    await page.locator('.peek .mini').first().click();   // dải xem trước ở trang điểm đến → chi tiết một địa điểm
    await page.locator('details', { hasText: 'Về dữ liệu' }).waitFor({ state: 'attached' });
    const about = page.locator('details', { hasText: 'Về dữ liệu' });
    await about.locator('summary').click();
    assert.match(await txt(about), /Wikimedia Commons/, 'nêu nguồn ảnh');
    assert.match(await txt(about), /Creative Commons/, 'nêu giấy phép');
  },
};
