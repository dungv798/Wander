// F04 (T5): xếp địa điểm vào ngày. Đếm số lần chạm (tiêu chí: ≤ 1 chạm mỗi nơi khi xếp tay, ≤ 4 chạm với "Xếp giúp tôi"),
// Hoàn tác, chọn nhiều, ngày trống, khoảng cách "ước tính", bố cục hai cột ở 1280.
export default {
  id: 'F04',
  title: 'xếp vào ngày: chip một chạm, Xếp giúp tôi + Hoàn tác, chọn nhiều, ngày trống',
  size: 390,
  async run({ page, url, assert, newPage }) {
    const fresh = async (p) => { await p.goto(url + '/'); await p.evaluate(() => localStorage.clear()); await p.goto(url + '/'); };
    const openTrip = async (p) => {
      await p.locator('.tab[data-go="trips"]').click();
      await p.locator('[data-trip]').first().click();
      await p.locator('.mapbox').waitFor();
    };
    const progress = async (p) => (await p.locator('.daysec:not(.costbox) .dayhead .s').first().textContent()).trim();

    // ---- A. Xếp tay: đúng 1 chạm cho mỗi nơi chưa có ngày ----
    await fresh(page);
    await openTrip(page);
    assert.match(await progress(page), /9\/12/, 'khởi đầu: 9/12 mục đã có ngày');
    const chips = page.locator('.assign .dchip[data-assign$=":1"]');
    const n = await chips.count();
    assert.equal(n, 3, '3 nơi chưa có ngày, mỗi nơi có chip "Ngày 1"');
    let taps = 0;
    while ((await page.locator('.assign .dchip[data-assign$=":1"]').count()) > 0) {
      await page.locator('.assign .dchip[data-assign$=":1"]').first().click();
      taps++;
      await page.waitForTimeout(80);
    }
    assert.equal(taps, 3, 'xếp tay: 1 chạm mỗi nơi (3 nơi = 3 chạm)');
    assert.match(await progress(page), /12\/12/, 'sau khi xếp tay: 12/12');

    // ---- B. Xếp giúp tôi: xem trước → áp dụng (2 chạm) → Hoàn tác trả đúng ----
    await fresh(page);
    await openTrip(page);
    await page.locator('[data-act="autoPlan"]').click();
    await page.locator('#panel .plan').waitFor();
    assert.match(await page.locator('#panel .pp').textContent(), /đường chim bay/, 'xem trước nói rõ cách tính (đường chim bay)');
    assert.equal(await page.locator('#panel .plan > div').count() > 0, true, 'xem trước có ít nhất một ngày');
    await page.locator('[data-act="applyPlan"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.match(await progress(page), /12\/12/, 'áp dụng gợi ý: 12/12 (2 chạm)');
    await page.locator('#undoBtn').click();
    assert.match(await progress(page), /9\/12/, 'Hoàn tác trả về 9/12');
    // "Để tôi tự xếp" không đổi gì
    await page.locator('[data-act="autoPlan"]').click();
    await page.locator('#panel .plan').waitFor();
    await page.locator('#panel [data-act="closeSheet"]').click();
    assert.match(await progress(page), /9\/12/, 'đóng xem trước: không đổi gì (gợi ý chỉ là đề nghị)');

    // ---- C. Thành viên không thấy nút Xếp giúp tôi (chỉ người tạo) ----
    await page.locator('[data-role="member"]').click();
    assert.equal(await page.locator('[data-act="autoPlan"]').count(), 0, 'thành viên không có nút Xếp giúp tôi');
    await page.locator('[data-role="owner"]').click();

    // ---- D. Ngày trống + chọn nhiều ----
    await fresh(page);
    await openTrip(page);
    await page.locator('[data-dtab="3"]').click();
    assert.match(await page.locator('.emptyday').first().textContent(), /Ngày này chưa có mục nào/, 'ngày trống có thông báo');
    await page.locator('.emptyday [data-act="addToDay"]').click();
    await page.locator('[data-pick]').first().waitFor();
    assert.equal(await page.locator('[data-pick]').count(), 3, 'danh sách chọn nhiều có đúng 3 nơi chưa có ngày');
    await page.locator('[data-pick]').nth(0).check();
    await page.locator('[data-pick]').nth(1).check();
    await page.locator('[data-act="doAddToDay"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.equal(await page.locator('.irow').count(), 2, 'Ngày 3 có 2 nơi sau khi chọn nhiều');
    await page.locator('#undoBtn').click();
    assert.equal(await page.locator('.irow').count(), 0, 'Hoàn tác: Ngày 3 trống lại');

    // ---- E. Khoảng cách luôn "ước tính" ----
    await page.locator('[data-dtab="1"]').click();
    const travel = await page.locator('.travel').allTextContents();
    assert.equal(travel.length > 0 && travel.every((t) => /ước tính/.test(t)), true, 'mọi dòng khoảng cách ghi "ước tính": ' + travel.join(' | '));
    const dayHead = await page.locator('.dayhead .s').first().textContent();
    assert.match(dayHead, /ước tính/, 'tổng thời gian trên đường của ngày ghi "ước tính"');

    // ---- F. Trang chuyến ở 1280: bản đồ trái, danh sách phải, không cuộn ngang ----
    const desk = await newPage({ size: 1280 });
    await fresh(desk);
    await openTrip(desk);
    const geo = await desk.evaluate(() => {
      const m = document.querySelector('.mapbox').getBoundingClientRect(), b = document.querySelector('.sheetbody').getBoundingClientRect();
      return { mapRight: m.right, bodyLeft: b.left, bodyW: b.width, overflow: document.documentElement.scrollWidth > window.innerWidth };
    });
    assert.ok(geo.mapRight <= geo.bodyLeft + 1, `1280: bản đồ bên trái, danh sách bên phải (${geo.mapRight} ≤ ${geo.bodyLeft})`);
    assert.ok(geo.bodyW >= 440, '1280: cột danh sách rộng ≥ 440, đo ' + geo.bodyW);
    assert.equal(geo.overflow, false, '1280: không cuộn ngang');
  },
};
