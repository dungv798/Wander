// F03 (T4): tạo chuyến và sửa chuyến, cộng các lỗi skeptic đã chỉ ra (khóa lại để không tái phát).
export default {
  id: 'F03',
  title: 'tạo/sửa chuyến, quyền xóa Q-c, ngăn kéo, đổi cỡ giữ form',
  size: 390,
  async run({ page, url, assert, newPage }) {
    // app nhớ màn hiện tại trong localStorage: mỗi đoạn bắt đầu từ trạng thái sạch
    const fresh = async (p) => { await p.goto(url + '/'); await p.evaluate(() => localStorage.clear()); await p.goto(url + '/'); };
    // ---- Tạo chuyến từ đầu, ngân sách hiển thị đầy đủ VND, chuyến rỗng không nói "đã có ngày" ----
    await fresh(page);
    await page.locator('.sky, .hero-w').first().waitFor();
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('.tcard').first().waitFor();
    await page.locator('[data-act="create"]').first().click();
    await page.locator('#s-name').waitFor();
    // kiểm tra xác thực
    const start = await page.locator('#s-start').inputValue();
    await page.locator('#s-end').fill('2000-01-01');
    await page.locator('[data-act="doCreate"]').click();
    assert.match(await page.locator('#toast').textContent(), /Ngày về phải sau hoặc bằng ngày đi/, 'ngày về trước ngày đi bị từ chối');
    await page.locator('#s-end').fill(start);
    await page.locator('#s-budget').fill('-5');
    await page.locator('[data-act="doCreate"]').click();
    assert.match(await page.locator('#toast').textContent(), /số nguyên/, 'ngân sách âm bị từ chối (D17)');
    await page.locator('#s-budget').fill('3000');
    await page.locator('[data-act="doCreate"]').click();
    await page.locator('.mapbox').waitFor();
    assert.match(await page.locator('.sheetbody').textContent(), /Ngân sách 3\.000\.000\s₫/, 'ngân sách hiển thị đầy đủ VND');
    assert.equal(await page.locator('.sheetbody').getByText('Mọi địa điểm đã có ngày').count(), 0, 'chuyến rỗng không nói "mọi địa điểm đã có ngày"');
    assert.equal(await page.locator('.sheetbody').getByText('Chưa có địa điểm nào').count() > 0, true, 'chuyến rỗng có thông báo đúng');

    // ---- Tờ phủ không tràn ngang ở 390 (lỗi 25/10: ô ngày hai cột làm tờ rộng 414) ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-act="create"]').first().click();
    await page.locator('#s-name').waitFor();
    const over = async () => page.evaluate(() => { const p = document.getElementById('panel'); return p.scrollWidth - p.clientWidth; });
    assert.ok((await over()) <= 0, 'tờ tạo chuyến không tràn ngang, tràn ' + (await over()) + ' px');
    const chipBg = await page.locator('#panel .fchip').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    const panelBg = await page.locator('#panel').evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.notEqual(chipBg, panelBg, 'chip trong tờ phủ có nền khác nền tờ (nhìn ra là nút)');
    await page.locator('[data-act="closeSheet"]').first().click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-act="editTrip"]').click();
    await page.locator('#e-end').waitFor();
    assert.ok((await over()) <= 0, 'tờ sửa chuyến không tràn ngang, tràn ' + (await over()) + ' px');
    assert.equal(await page.evaluate(() => document.getElementById('panel').scrollLeft), 0, 'tờ không bị cuộn ngang');

    // ---- Ngày biên (DateRange.MAX_DAYS = 366): 1 ngày, 366 ngày; 367 ngày bị từ chối; sửa vượt 366 bị từ chối; gợi ý dd/mm/yyyy ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-act="create"]').first().click();
    await page.locator('#s-name').waitFor();
    const st0 = await page.locator('#s-start').inputValue();
    assert.match(await page.locator('#s-start').locator('..').locator('.hint').textContent(), /^(CN|T[2-7]), \d{2}\/\d{2}\/\d{4}$/, 'gợi ý ngày dạng "T7, 31/10/2026"');
    const plus = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
    await page.locator('#s-end').fill(plus(st0, 366));   // 367 ngày
    await page.locator('[data-act="doCreate"]').click();
    assert.match(await page.locator('#toast').textContent(), /tối đa 366 ngày/, '367 ngày bị từ chối');
    await page.locator('#s-end').fill(plus(st0, 365));   // đúng 366 ngày
    await page.locator('[data-act="doCreate"]').click();
    await page.locator('.mapbox').waitFor();
    assert.equal(await page.locator('.dtab').count(), 367, 'chuyến 366 ngày: Tổng quan + 366 tab ngày');
    await page.locator('[data-act="editTrip"]').click();
    await page.locator('#e-end').fill(plus(await page.locator('#e-start').inputValue(), 366));
    await page.locator('[data-act="doEdit"]').click();
    assert.match(await page.locator('#e-warn').textContent(), /tối đa 366 ngày/, 'sửa vượt 366 ngày bị từ chối');
    await page.locator('#e-end').fill(await page.locator('#e-start').inputValue());
    await page.locator('[data-act="doEdit"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.dtab').count(), 2, 'sửa còn 1 ngày: Tổng quan + 1 tab ngày');

    // ---- DR-008 Q-b: "Dự kiến N ngày": chuyến vẫn có ngày (R5), gắn cờ "chưa chắc", chốt ngày sau ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-act="create"]').first().click();
    await page.locator('#s-name').waitFor();
    assert.equal(await page.locator('#s-n-wrap').isVisible(), false, 'ô số ngày ẩn khi chưa bật dự kiến');
    await page.locator('#s-tent').check();
    assert.equal(await page.locator('#s-n-wrap').isVisible(), true, 'bật dự kiến: hiện ô số ngày');
    await page.locator('#s-n').fill('0');
    await page.locator('[data-act="doCreate"]').click();
    assert.match(await page.locator('#toast').textContent(), /từ 1 đến 366/, 'số ngày dự kiến ngoài 1–366 bị từ chối');
    await page.locator('#s-n').fill('4');
    await page.locator('[data-act="doCreate"]').click();
    await page.locator('.mapbox').waitFor();
    assert.match(await page.locator('.thead .note').textContent(), /chưa chắc/, 'chuyến dự kiến mang nhãn "chưa chắc"');
    assert.equal(await page.locator('.dtab').count(), 5, 'Tổng quan + 4 ngày (chuyến vẫn có ngày, R5)');
    await page.locator('[data-act="editTrip"]').click();
    await page.locator('#e-sure').check();
    await page.locator('[data-act="doEdit"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.doesNotMatch(await page.locator('.thead .note').textContent(), /chưa chắc/, 'chốt ngày: bỏ nhãn "chưa chắc"');

    // ---- Sửa ngày: cảnh báo cắt mục theo SỐ mục ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-act="editTrip"]').click();
    const s0 = await page.locator('#e-start').inputValue();
    await page.locator('#e-end').fill(s0);
    await page.locator('[data-act="doEdit"]').click();
    assert.match(await page.locator('#e-warn').textContent(), /\d+ địa điểm nằm ở ngày bị cắt/, 'cảnh báo cắt ngày hiện');
    assert.equal(await page.locator('#sheet:not([hidden])').count(), 1, 'chưa lưu: tờ sửa vẫn mở');
    const d1 = new Date(s0); d1.setDate(d1.getDate() + 1);
    await page.locator('#e-end').fill(d1.toISOString().slice(0, 10));
    await page.locator('[data-act="doEdit"]').click();
    await page.waitForFunction(() => document.getElementById('sheet').hidden || /ngày bị cắt/.test((document.getElementById('e-warn') || {}).textContent || ''), null, { timeout: 5000 });   // hoặc đã lưu (không mất mục), hoặc cảnh báo tính lại

    // ---- Q-c: thành viên xóa TRỰC TIẾP mục do mình thêm; mục của người khác chỉ gửi đề nghị ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-role="member"]').click();
    const own = page.locator('[data-item-open]').filter({ hasText: 'Phố cổ Đồng Văn' }).first();
    await own.click();
    await page.locator('#panel').getByRole('button', { name: 'Xóa', exact: true }).waitFor();
    await page.locator('#panel').getByRole('button', { name: 'Xóa', exact: true }).click();
    await page.locator('#undoBtn').waitFor();
    assert.equal(await page.locator('.irow').filter({ hasText: 'Phố cổ Đồng Văn' }).count(), 0, 'mục tự thêm: xóa ngay, không phải đề nghị');
    await page.locator('#undoBtn').click();
    assert.equal(await page.locator('.irow').filter({ hasText: 'Phố cổ Đồng Văn' }).count(), 1, 'Hoàn tác khôi phục mục');
    const other = page.locator('[data-item-open]').filter({ hasText: 'Tây Côn Lĩnh' }).first();
    await other.click();
    assert.equal(await page.locator('#panel').getByRole('button', { name: 'Đề nghị xóa' }).count() > 0, true, 'mục của người khác: chỉ có "Đề nghị xóa"');
    await page.keyboard.press('Escape');

    // ---- Ngăn kéo 1280: "Chọn nơi này" trong ngăn kéo đóng đúng, nội dung giãn lại; focus ban đầu nằm trong ngăn kéo ----
    const desk = await newPage({ size: 1280 });
    await desk.goto(url + '/');
    await desk.locator('.dcard').click();
    await desk.locator('[data-go="deck"]').click();
    await desk.locator('.card.front').waitFor();
    await desk.locator('[data-act="info"]').click();
    await desk.locator('#gal').waitFor();
    assert.equal(await desk.evaluate(() => !!document.activeElement.closest('#panel')), true, 'focus ban đầu nằm trong ngăn kéo (không rơi vào nút bị khóa)');
    await desk.locator('#panel [data-sheet="r"]').click();
    await desk.waitForFunction(() => document.querySelector('.deckbar .pill')?.textContent.includes('(1)'));
    assert.equal(await desk.evaluate(() => document.body.classList.contains('has-drawer')), false, 'chọn từ ngăn kéo xong: nội dung giãn lại');
    assert.equal(await desk.locator('#sheet:not([hidden])').count(), 0, 'ngăn kéo đã đóng');
    // ngăn kéo đi theo thẻ kế khi bỏ qua ở ngoài
    await desk.locator('[data-act="info"]').click();
    await desk.locator('#gal').waitFor();
    const title1 = await desk.locator('#panel h2').first().textContent();
    await desk.locator('[data-act="skip"]').click();
    await desk.waitForFunction((t) => document.querySelector('#panel h2') && document.querySelector('#panel h2').textContent !== t, title1);
    assert.notEqual(await desk.locator('#panel h2').first().textContent(), title1, 'ngăn kéo chuyển sang thẻ kế, không còn hiện thẻ vừa bỏ qua');

    // ---- Đổi cỡ khi đang nhập form tạo chuyến: không mất chữ ----
    const rs = await newPage({ size: 1280 });
    await rs.goto(url + '/');
    await rs.locator('.tab[data-go="trips"]').click();
    await rs.locator('[data-act="create"]').first().click();
    await rs.locator('#s-name').fill('Chuyến thử đổi cỡ');
    await rs.setViewportSize({ width: 800, height: 800 });
    await rs.waitForTimeout(400);
    assert.equal(await rs.locator('#s-name').inputValue(), 'Chuyến thử đổi cỡ', 'đổi cỡ không làm mất form đang nhập');
  },
};
