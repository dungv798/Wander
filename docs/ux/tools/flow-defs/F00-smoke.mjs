// Luồng cơ bản của app v4 đã chuyển: Khám phá → cẩm nang → bộ thẻ → chọn → Đã chọn. Ảnh thật hiện, không lỗi console, không cuộn ngang.
export default {
  id: 'F00',
  title: 'app: Khám phá → cẩm nang → quẹt chọn → Đã chọn',
  size: 390,
  async run({ page, url, assert }) {
    await page.goto(url + '/');
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await page.locator('.fan figure').count(), 3, 'quạt 3 thẻ ảnh');
    assert.equal(await page.locator('.sky .plane, .sky svg.plane').count() > 0, true, 'có máy bay giấy minh họa');
    await page.waitForFunction(() => [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).every((i) => i.complete), null, { timeout: 8000 }).catch(() => {});   // chờ ảnh tải xong rồi mới đo
    const loaded = await page.evaluate(() => [...document.images].filter((i) => { const r = i.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).every((i) => i.complete && i.naturalWidth > 0));
    assert.equal(loaded, true, 'mọi ảnh đang nằm trong khung nhìn phải tải được (ảnh lazy ở dưới màn hình chưa tải là đúng)');

    await page.locator('.dcard').click();
    await page.locator('.dhero').waitFor();
    assert.match(await page.locator('.dhero h1').textContent(), /Hà Giang/);
    await page.locator('[data-go="deck"]').click();
    await page.locator('.deck .card.front').waitFor();
    assert.match(await page.locator('.deckbar .note').textContent(), /Đã xem 0\/9/);

    const first = await page.locator('.card.front').getAttribute('data-id');
    await page.locator('[data-act="like"]').click();
    await page.waitForFunction((id) => document.querySelector('.card.front')?.dataset.id !== id, first);
    assert.match(await page.locator('.deckbar .pill').textContent(), /\(1\)/, 'đã chọn 1');

    await page.locator('.deckbar .pill').click();
    await page.locator('.grid .tile').first().waitFor();
    assert.equal(await page.locator('.grid .tile').count(), 1, 'Đã chọn có đúng 1 địa điểm');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'không cuộn ngang');
  },
};
