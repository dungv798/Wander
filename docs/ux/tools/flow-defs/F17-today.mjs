// F17 (DG-2 A5, DR-012 Q1): màn "Hôm nay" khi đang đi (KHUNG): đọc từ dữ liệu chuyến có sẵn, giả lập ngày, trạng thái chưa tới / đã qua / chưa chắc ngày.
export default {
  id: 'F17',
  title: 'Hôm nay: kế hoạch ngày hiện tại, việc cần làm, chi phí, bản đồ ngoài, chưa tới/đã qua/chưa chắc ngày',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-go="today"]').click();
    await page.locator('h1', { hasText: 'Hôm nay' }).waitFor();

    // ---- A. Ngày thật (chuyến mẫu ở tương lai): chưa tới ngày đi ----
    assert.match(await txt(page.locator('.empty')), /Chưa tới ngày đi/, 'ngày thật trước chuyến: chưa tới');
    assert.match(await txt(page.locator('.empty')), /Còn \d+ ngày nữa/, 'đếm ngày còn lại');
    assert.equal(await page.locator('#tabbar').isHidden(), true, 'ẩn thanh tab ở màn hôm nay trên điện thoại');

    // ---- B. Giả lập Ngày 1: danh sách theo giờ, thống kê, bản đồ ngoài mở tab mới có rel an toàn ----
    await page.locator('[data-act="todaySim:"]').waitFor();
    await page.locator('[data-act^="todaySim:"][data-act*="-"]').first().click();
    assert.match(await txt(page.locator('.pagehead')), /ngày giả lập/, 'nói rõ là ngày giả lập');
    assert.ok(await page.locator('.trow').count() >= 1, 'có mục hôm nay');
    assert.match(await txt(page.locator('.stats')), /Ngày 1\/3/, 'Ngày 1 trên 3');
    const link = page.locator('.trow a').first();
    assert.equal(await link.getAttribute('target'), '_blank', 'bản đồ mở tab mới');
    assert.match(await link.getAttribute('rel'), /noopener/, 'rel noopener');
    assert.match(await link.getAttribute('href'), /^https:\/\/www\.google\.com\/maps\/search\//, 'liên kết ra app bản đồ ngoài');
    assert.match(await link.getAttribute('aria-label'), /liên kết ra ngoài/, 'nói rõ là liên kết ra ngoài');
    assert.match(await txt(page.locator('.pad-x .note').last()), /app bản đồ ngoài/, 'chú thích liên kết ngoài');

    // ---- C. Việc cần làm: tích xong ngay trên màn Hôm nay (mỗi người một phần) ----
    await page.locator('[data-act^="todaySim:"][data-act*="-"]').nth(1).click();   // Ngày 2 (mẫu có "Mua áo mưa"/việc cần làm tùy dữ liệu)
    const taskBtn = page.locator('.trow [data-act^="task:"]').first();
    if (await taskBtn.count()) {   // chuyến mẫu có thể không có việc cần làm ở ngày này; nếu có thì phải tích được
      await taskBtn.click();
      assert.equal(await page.locator('.trow [data-act^="task:"]').first().getAttribute('aria-pressed'), 'true', 'tích xong việc cần làm');
    }
    const simKey = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('wander-kham-pha-proto-v8')).todayBy || {}).length);
    assert.equal(simKey, 1, 'ngày giả lập lưu riêng theo từng chuyến (không dùng chung)');

    // ---- D. Đã qua ----
    await page.locator('[data-act="todaySim:after"]').click();
    assert.match(await txt(page.locator('.empty')), /Chuyến đi đã kết thúc/, 'sau chuyến: đã kết thúc');

    // ---- E. Chuyến chưa chắc ngày: không có "hôm nay" ----
    await page.locator('.empty [data-go="trip"]').click();
    await page.locator('.mapbox').waitFor();
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.trips[0].tentative = true; s.todaySim = null; localStorage.setItem(k, JSON.stringify(s)); }, 'wander-kham-pha-proto-v8');
    await page.reload();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-go="today"]').click();
    assert.match(await txt(page.locator('.empty')), /chưa chắc ngày/, 'chuyến dự kiến ngày: không có Hôm nay');
  },
};
