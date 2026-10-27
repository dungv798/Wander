// F14: khung thích ứng của app v4 ở 390 / 800 / 1280 và các trạng thái toàn cục.
// 390: thanh tab nổi + tờ dưới. 800: navbar trên cùng 68 + hộp thoại giữa. 1280: navbar trên cùng + ngăn kéo phải 440 không che nội dung (PO 25/10/2026: navbar ở trên).
export default {
  id: 'F14',
  title: 'khung thích ứng 390/800/1280, chi tiết, đổi cỡ, trạng thái toàn cục',
  size: 390,
  async run({ page, url, assert, newPage }) {
    const noOverflow = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    const openInfoFromDeck = async (p) => {
      await p.goto(url + '/');
      await p.locator('.dcard').click();
      await p.locator('[data-go="deck"]').click();
      await p.locator('.card.front').waitFor();
      await p.locator('[data-act="info"]').click();
      await p.locator('#gal').waitFor();
    };

    // ---- 390: thanh tab nổi, chi tiết là tờ dưới có bẫy focus, Esc đóng và trả focus ----
    await page.goto(url + '/');
    await page.locator('.sky, .hero-w').first().waitFor();
    const tb = await page.locator('#tabbar').evaluate((el) => { const r = el.getBoundingClientRect(); return { w: r.width, bottom: window.innerHeight - r.bottom }; });
    assert.ok(tb.w > 300 && tb.bottom >= 8 && tb.bottom <= 40, `390: thanh tab nổi gần đáy (rộng ${tb.w}, cách đáy ${tb.bottom})`);
    assert.equal(await noOverflow(page), true, '390: không cuộn ngang');
    await openInfoFromDeck(page);
    const sheetBox = await page.locator('#panel').evaluate((el) => ({ bottom: window.innerHeight - el.getBoundingClientRect().bottom }));
    assert.ok(sheetBox.bottom <= 1, '390: chi tiết là tờ dưới chạm đáy');
    assert.equal(await page.locator('#panel').getAttribute('aria-modal'), 'true', '390: aria-modal');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#panel')), true, '390: Tab không thoát khỏi tờ dưới');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('#panel')), true, '390: Shift+Tab không thoát khỏi tờ dưới');
    await page.keyboard.press('Escape');
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => document.activeElement.dataset.act), 'info', '390: đóng xong focus trở về nút "Chi tiết"');

    // ---- 800: navbar trên cùng, hộp thoại giữa ----
    const tab = await newPage({ size: 800 });
    await tab.goto(url + '/');
    await tab.locator('.sky, .hero-w').first().waitFor();
    const rail = await tab.locator('#tabbar').evaluate((el) => { const r = el.getBoundingClientRect(); return { w: r.width, left: r.left, top: r.top, h: r.height }; });
    assert.ok(Math.abs(rail.h - 68) < 1 && rail.left === 0 && rail.top === 0 && rail.w >= 799, `800: navbar trên cùng cao 68, rộng hết khung (đo ${rail.w}×${rail.h})`);
    const wraps = await tab.locator('#tabbar .tab span:not(.dot)').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 26).map((e) => e.textContent));
    assert.deepEqual(wraps, [], '800: nhãn navbar không xuống dòng: ' + wraps.join(', '));
    assert.equal(await noOverflow(tab), true, '800: không cuộn ngang');
    await openInfoFromDeck(tab);
    assert.equal(await tab.locator('#sheet.drawer').count(), 0, '800: không phải ngăn kéo');
    const dlg = await tab.locator('#panel').evaluate((el) => { const r = el.getBoundingClientRect(); return { w: r.width, top: r.top, bottom: window.innerHeight - r.bottom }; });
    assert.ok(dlg.w <= 560.5 && dlg.top > 0 && dlg.bottom > 0, `800: hộp thoại giữa rộng ≤ 560 (đo ${dlg.w})`);
    await tab.keyboard.press('Escape');

    // ---- 1280: thanh bên 264, ngăn kéo phải 440 không che nội dung ----
    const desk = await newPage({ size: 1280 });
    await desk.goto(url + '/');
    await desk.locator('.sky, .hero-w').first().waitFor();
    const w1280 = await desk.locator('#tabbar').evaluate((el) => el.getBoundingClientRect().width);
    assert.ok(w1280 >= 1279, '1280: navbar trên cùng rộng hết khung, đo ' + w1280);
    await openInfoFromDeck(desk);
    assert.equal(await desk.locator('#sheet.drawer').count(), 1, '1280: ngăn kéo');
    assert.equal(await desk.locator('#panel').getAttribute('aria-modal'), 'false', '1280: ngăn kéo không phải modal');
    const geo = await desk.evaluate(() => {
      const p = document.getElementById('panel').getBoundingClientRect(), s = document.getElementById('screen').getBoundingClientRect(), d = document.querySelector('.deck').getBoundingClientRect();
      return { panelW: p.width, panelLeft: p.left, screenRight: s.right, deckRight: d.right };
    });
    assert.ok(Math.abs(geo.panelW - 440) < 1, '1280: ngăn kéo rộng 440, đo ' + geo.panelW);
    assert.ok(geo.screenRight <= geo.panelLeft + 0.5 && geo.deckRight <= geo.panelLeft, `1280: nội dung co lại, không nằm dưới ngăn kéo (${geo.screenRight} ≤ ${geo.panelLeft})`);
    await desk.locator('[data-act="skip"]').click();
    await desk.waitForTimeout(500);
    assert.equal(await desk.locator('#sheet.drawer').count(), 1, '1280: thao tác ở nội dung khi ngăn kéo mở không đóng ngăn kéo');
    await desk.keyboard.press('Escape');
    await desk.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal(await desk.evaluate(() => document.body.classList.contains('has-drawer')), false, '1280: đóng xong nội dung giãn lại');

    // ---- Đổi cỡ khi chi tiết đang mở: 390 → 1280 (ngăn kéo) → 800 (hộp thoại), không nhân đôi ----
    const rs = await newPage({ size: 390 });
    await openInfoFromDeck(rs);
    await rs.setViewportSize({ width: 1280, height: 800 });
    await rs.locator('#sheet.drawer #gal').waitFor();
    await rs.setViewportSize({ width: 800, height: 800 });
    await rs.locator('#sheet:not(.drawer):not([hidden]) #gal').waitFor();   // chờ theo điều kiện: sự kiện đổi cỡ xử lý bất đồng bộ
    assert.equal(await rs.locator('#sheet:not([hidden])').count(), 1, 'đổi cỡ: đúng một lớp chi tiết');
    assert.equal(await rs.locator('#sheet.drawer').count(), 0, 'đổi 1280→800: thành hộp thoại giữa');

    // ---- Trạng thái toàn cục (390) ----
    await page.evaluate(() => localStorage.clear());   // app nhớ màn hiện tại; bắt đầu từ trạng thái sạch
    await page.goto(url + '/?state=loading');
    await page.locator('.skeleton').first().waitFor();
    assert.equal(await page.locator('[aria-busy="true"]').count() > 0, true, 'tải: có vùng aria-busy');
    await page.goto(url + '/?state=error');
    await page.getByRole('alert').waitFor();
    assert.match(await page.getByRole('alert').textContent(), /Không tải được dữ liệu/);
    await page.goto(url + '/?state=offline');
    await page.getByRole('status').filter({ hasText: 'ngoại tuyến' }).waitFor();
    await page.locator('.sky, .hero-w').first().waitFor();

    // ---- Xung đột phiên bản (409, ADR-003): thiết bị khác vừa sửa ----
    await page.goto(url + '/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('[data-act="protoConflict"]').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await page.locator('#panel').textContent(), /Chuyến đi đã thay đổi/, 'tiêu đề xung đột');
    assert.match(await page.locator('#panel').textContent(), /không ghi đè lên thay đổi đó/, 'nói rõ không ghi đè ngầm');
    await page.locator('[data-act="conflictReload"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Đã tải bản mới nhất/, 'tải lại bản mới');

    // ---- Dữ liệu hỏng: trạng thái lỗi, không trắng trang ----
    const bad = await newPage({ size: 390 });
    await bad.route('**/data/catalog/ha-giang.json', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{hong' }));
    await bad.goto(url + '/');
    await bad.getByRole('alert').waitFor();
    assert.match(await bad.getByRole('alert').textContent(), /Không tải được dữ liệu/, 'JSON hỏng → trạng thái lỗi');
  },
};
