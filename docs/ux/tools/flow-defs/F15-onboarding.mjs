// F15 (DG-2 A2, làm lại 25/10/2026): onboarding 3 thẻ cảm xúc cho người mới hoàn toàn (?fresh=1): ảnh thật toàn khung, không liệt kê tính năng, bỏ qua được, hiện một lần.
export default {
  id: 'F15',
  title: 'onboarding: ảnh thật toàn khung, lời mời đi, tiến độ, Quay lại, Bỏ qua, hiện một lần, ?intro=0 bỏ qua, có chuyển động',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const start = async (q = '?fresh=1') => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/' + q); };
    const bar = () => page.locator('.obx-bar');

    // ---- A. Thẻ 1: ảnh thật, tên nơi, lời mời; không thanh tab; tiến độ 1/3; chưa có Quay lại ----
    await start();
    await page.locator('.obx h1').waitFor();
    assert.equal(await txt(page.locator('.obx h1')), 'Có một nơi đang đợi bạn', 'thẻ 1');
    assert.equal(await bar().getAttribute('aria-valuenow'), '1', 'tiến độ 1');
    assert.equal(await bar().getAttribute('aria-valuemax'), '3', 'tổng 3 bước');
    assert.match(await bar().getAttribute('aria-label'), /Bước 1 trên 3/, 'thanh tiến độ có nhãn');
    assert.equal(await page.locator('[data-act="obBack"]').count(), 0, 'thẻ 1 chưa có Quay lại');
    assert.equal(await page.locator('#tabbar').isHidden(), true, 'thanh tab ẩn khi giới thiệu');
    assert.equal(await page.locator('.obs-hero img').count(), 1, 'một thẻ ảnh bìa ở cảnh 1');
    assert.match(await page.locator('.obs-hero img').getAttribute('src'), /^\/catalog\/photos\//, 'ảnh thật của kho biên tập');
    assert.match(await txt(page.locator('.obx-eyebrow')), /Hoàng Su Phì, Hà Giang/, 'nêu tên nơi thật');
    assert.equal(await page.locator('.obs-invite .obs-fact').count(), 3, 'thẻ 1: ba sự thật lấy từ kho biên tập (tên nơi, mùa đẹp, số nơi)');
    assert.match(await txt(page.locator('.obs-invite')), /9 nơi đang chờ bạn quẹt/, 'số nơi đúng với kho biên tập');
    assert.match(await txt(page.locator('.obx-credit')), /Ảnh: .+/, 'ghi công ảnh');
    assert.match(await txt(page.locator('.obx-credit')), /Bản nháp nội dung/, 'nội dung có nhãn bản nháp');
    const body = await txt(page.locator('.obx h1')) + ' ' + await txt(page.locator('.obx-text'));
    assert.equal(/tính năng|đăng ký|email|mã khôi phục|\d+K\+|đánh giá|★/i.test(body), false, 'không quảng cáo tính năng, không số liệu bịa: ' + body);

    // ---- B. Tiếp, Quay lại: ảnh chuyển tại chỗ, tiến độ, focus về tiêu đề ----
    await page.locator('[data-act="obNext"]').click();
    assert.equal(await txt(page.locator('.obx h1')), 'Quẹt phải là mê, quẹt trái là thôi', 'thẻ 2');
    assert.equal(await bar().getAttribute('aria-valuenow'), '2', 'tiến độ 2');
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.tagName), 'H1', 'focus về tiêu đề mới');
    assert.equal(await page.locator('.obs-swipe').count(), 1, 'cảnh 2 là bộ bài tự quẹt');
    assert.equal(await page.locator('.obx-bar i.on').count(), 2, 'hai đoạn tiến độ sáng');
    assert.equal(await page.locator('.obs-swipe .obs-card').count(), 3, 'thẻ 2: bộ bài mẫu 3 thẻ ảnh thật tự quẹt');
    assert.equal(await page.locator('.obs-swipe .obs-card img').first().evaluate((e) => e.getAttribute('src').startsWith('/catalog/photos/')), true, 'ảnh bộ bài mẫu là ảnh thật của kho biên tập');
    assert.match(await page.locator('.obs-card.c1').evaluate((e) => getComputedStyle(e).animationName), /swC1/, 'bộ bài có chuyển động tự quẹt');
    assert.equal(await page.locator('#obx-st').getAttribute('aria-hidden'), 'true', 'minh họa trang trí ẩn với trình đọc màn hình');
    await page.locator('[data-act="obBack"]').click();
    assert.equal(await txt(page.locator('.obx h1')), 'Có một nơi đang đợi bạn', 'Quay lại về thẻ 1');
    await page.locator('[data-act="obNext"]').click();
    await page.locator('[data-act="obNext"]').click();
    assert.equal(await txt(page.locator('.obx h1')), 'Rồi lịch tự thành hình', 'thẻ 3');
    assert.equal(await page.locator('.obs-plan .obs-day').count(), 2, 'thẻ 3: lịch mẫu 2 ngày');
    assert.equal(await page.locator('.obs-plan .obs-stop').count(), 4, 'thẻ 3: mỗi ngày 2 nơi thật');
    assert.equal(await page.locator('.obs-plan .obs-done').count(), 1, 'thẻ 3: dòng "lịch sẵn sàng"');
    assert.equal(await txt(page.locator('[data-act="obNext"]')), 'Bắt đầu khám phá', 'thẻ cuối: nút mời đi');

    // ---- C. Hoàn tất: vào Khám phá, thanh tab hiện, nhớ đã xem ----
    await page.locator('[data-act="obNext"]').click();
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await page.locator('#tabbar').isVisible(), true, 'thanh tab hiện lại');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('wander-kham-pha-proto-v8')).onboarded), true, 'đã ghi nhớ đã xem');
    await page.goto(url + '/');
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await page.locator('.obx').count(), 0, 'mở lại không hiện giới thiệu nữa');

    // ---- D. Bỏ qua từ thẻ 1 ----
    await start();
    await page.locator('[data-act="obSkip"]').click();
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('wander-kham-pha-proto-v8')).onboarded), true, 'bỏ qua cũng ghi nhớ');

    // ---- E. ?intro=0 bỏ qua giới thiệu (dùng cho luồng thử khác) ----
    await start('?fresh=1&intro=0');
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await page.locator('.obx').count(), 0, '?intro=0 vào thẳng Khám phá');

    // ---- F. Có chuyển động thật: ảnh zoom chậm; giảm chuyển động thì tắt ----
    await start();
    await page.locator('.obx h1').waitFor();
    assert.match(await page.locator('.obs-hero img').evaluate((e) => getComputedStyle(e).animationName), /kenburns/, 'ảnh có zoom chậm (Ken Burns)');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dur = await page.locator('.obs-hero img').evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
    assert.ok(dur < 0.01, 'giảm chuyển động: thời lượng gần 0, thực tế ' + dur);
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    // ---- G. Bố cục máy tính: ảnh phủ toàn khung, không thanh trên, không tràn ngang ----
    const wide = await page.context().newPage();
    await wide.setViewportSize({ width: 1280, height: 800 });
    await wide.goto(url + '/'); await wide.evaluate(() => localStorage.clear()); await wide.goto(url + '/?fresh=1');
    await wide.locator('.obx h1').waitFor();
    const m = await wide.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, w: document.querySelector('.obx').getBoundingClientRect().width, top: document.querySelector('#screen').getBoundingClientRect().top, nav: getComputedStyle(document.querySelector('#tabbar')).display }));
    assert.ok(m.sw <= m.cw, 'không tràn ngang ở 1280');
    assert.ok(m.w >= 1270, 'ảnh phủ toàn chiều ngang: ' + m.w);
    assert.equal(m.top, 0, 'sát đỉnh trang (không bị navbar đẩy xuống)');
    assert.equal(m.nav, 'none', 'ẩn navbar khi giới thiệu');
    await wide.close();
  },
};
