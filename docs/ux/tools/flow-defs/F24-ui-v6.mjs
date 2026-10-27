// F24 (v6, 26/10/2026): bản đồ địa hình, tờ kéo, thẻ quẹt toàn màn, lịch mẫu, một màu cho mọi ngày, ghi công bản đồ.
export default {
  id: 'F24',
  title: 'v6: bản đồ địa hình + tờ kéo + thẻ toàn màn + lịch mẫu + một màu cho mọi ngày',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const box = (sel) => page.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');

    // ---- A. Chuyến mẫu: bản đồ thật có ghim ảnh, tờ kéo có thanh nắm là nút, ba nấc ----
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.tmroot[data-ready="1"] .tm-pin:not(.is-hidden)').first().waitFor({ timeout: 10000 });
    assert.ok((await page.locator('.tm-pin').count()) >= 6, 'tổng quan: mọi mục có tọa độ đều có ghim');
    assert.equal(await page.locator('.tm-pin img').first().evaluate((e) => e.getAttribute('src').startsWith('/catalog/photos/')), true, 'ghim là ảnh thật của kho biên tập');
    assert.match(await txt(page.locator('.tm-credit').first()), /OpenStreetMap/, 'bản đồ ghi công OpenStreetMap');
    assert.equal(await page.locator('.tmroot').first().getAttribute('role'), 'region', 'bản đồ là vùng có nhãn');
    const grab = page.locator('.grab');
    assert.equal(await grab.evaluate((e) => e.tagName), 'BUTTON', 'thanh nắm là nút (bàn phím, đọc màn hình)');
    const snap = () => page.locator('.sheetbody').getAttribute('data-snap');
    assert.equal(await snap(), 'half', 'mặc định nấc nửa');
    await grab.focus(); await page.keyboard.press('ArrowUp');
    assert.equal(await snap(), 'full', 'ArrowUp: lên nấc đầy');
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('ArrowDown');
    assert.equal(await snap(), 'peek', 'ArrowDown hai lần: nấc thu gọn');
    assert.equal(await grab.getAttribute('aria-expanded'), 'false', 'aria-expanded theo nấc');
    await page.keyboard.press('ArrowUp');

    // ---- B. Tab ngày: tuyến vẽ, nhãn km, ghim đánh số; MỘT màu cho mọi ngày ----
    await page.locator('[data-dtab="1"]').click();
    await page.locator('.tm-seg').first().waitFor();
    assert.ok((await page.locator('.tm-seg').count()) >= 1, 'ngày 1 có tuyến');
    assert.ok((await page.locator('.tm-seg-label').count()) >= 1, 'đoạn tuyến có nhãn km');
    assert.ok((await page.locator('.tm-pin-body b').count()) >= 2, 'ghim ngày được đánh số');
    const colors = await page.evaluate(() => [1, 2, 3, 4, 5, 6, 7].map((n) => getComputedStyle(document.documentElement).getPropertyValue('--day-' + n).trim()));
    assert.equal(new Set(colors).size, 1, 'mọi ngày dùng cùng một màu nhấn: ' + colors.join(','));
    const tabBg = await page.evaluate(() => [...document.querySelectorAll('.dtab[aria-selected="false"]')].map((e) => getComputedStyle(e).backgroundColor));
    assert.equal(new Set(tabBg).size, 1, 'tab ngày chưa chọn cùng một màu nền');

    // ---- C. Thẻ quẹt toàn màn ----
    await page.locator('.mapbox [data-go="trips"]').click();
    await page.locator('.tab[data-go="explore"]').click();
    await page.locator('[data-go="dest"]').first().click();
    await page.locator('[data-go="deck"]').first().click();
    await page.locator('.deck .card.front').waitFor();
    const card = await box('.deck .card.front');
    assert.ok(card.w >= 388 && card.h >= 800, `thẻ phủ cả màn điện thoại (đo ${Math.round(card.w)}×${Math.round(card.h)})`);
    assert.equal(await page.locator('.card.front .card-info h2').count(), 1, 'tên địa điểm nổi trên ảnh');
    for (const b of await page.locator('.deckbar .iconbtn, .deckbar .pill, .filters .fchip, .actions .round').all()) {
      const r = await b.boundingBox(); assert.ok(r && r.width >= 43.9 && r.height >= 43.9, 'nút trên thẻ đủ vùng chạm 44 px: ' + JSON.stringify(r));
    }

    // ---- D. Lịch mẫu: tạo chuyến có ngày; chưa có danh tính thì hiện tờ lưu, "Để sau" lưu luôn ----
    await page.goto(url + '/?fresh=1&intro=0');   // người mới: chưa có danh tính
    await page.locator('[data-tpl]').first().waitFor({ state: 'attached' });
    await page.locator('[data-tpl]').first().scrollIntoViewIfNeeded();
    const before = 0;
    await page.locator('[data-tpl]').first().click();
    await page.locator('[data-act="idSkip"]').click();
    await page.locator('.tmroot[data-ready="1"]').first().waitFor({ timeout: 10000 });
    const st = await page.evaluate(() => JSON.parse(localStorage.getItem('wander-kham-pha-proto-v8')));
    assert.equal(st.trips.length, before + 1, 'tạo thêm đúng 1 chuyến từ lịch mẫu');
    const t = st.trips[st.trips.length - 1];
    assert.ok(t.items.length >= 5 && t.items.every((i) => i.day), 'mọi mục của lịch mẫu đã có ngày');
    assert.equal(new Set(t.items.map((i) => i.day)).size, 2, 'lịch mẫu 2 ngày');
    assert.equal(st.identity.code, null, '"Để sau": danh tính chưa có mã');
  }
};
