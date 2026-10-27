// F23 (vòng điều chỉnh UX 25/10/2026): navbar trên cùng ở màn rộng, giữ cuộn khi chọn ngày, bố cục chuyến đi/ngày trống, thẻ quẹt dọc, ít màu ở Tổng quan, chuyển động và giảm chuyển động, mã khôi phục "để sau" khác "hủy".
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F23',
  title: 'UX web: navbar trên, cuộn không nhảy, bố cục ngày trống, thẻ quẹt dọc, ít màu Tổng quan, chuyển động',
  size: 1280,
  async run({ page, url, assert, newPage }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const box = (p, sel) => p.locator(sel).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const fresh = async (p = page) => { await p.goto(url + '/'); await p.evaluate(() => localStorage.clear()); await p.goto(url + '/'); await p.locator('.sky, .hero-w').first().waitFor(); };

    // ---- A. Navbar ở TRÊN, thương hiệu bên trái, Cài đặt + Bảo mật bên phải; không còn thanh bên ----
    await fresh();
    const nav = await box(page, '#tabbar');
    assert.ok(nav.y === 0 && nav.h >= 60 && nav.h <= 72 && nav.w >= 1279, `navbar trên cùng cao ~68 rộng hết khung (đo ${nav.w}×${nav.h} tại y=${nav.y})`);
    const items = await page.locator('#tabbar .tab').evaluateAll((els) => els.map((e) => ({ t: e.textContent.trim(), y: Math.round(e.getBoundingClientRect().y), x: Math.round(e.getBoundingClientRect().x) })));
    assert.equal(new Set(items.map((i) => i.y)).size, 1, 'các mục navbar nằm cùng một hàng ngang');
    assert.ok(items[0].x < items[1].x && items[1].x < items[2].x, 'xếp trái sang phải');
    assert.equal(await page.locator('#tabbar .brand').count(), 1, 'có thương hiệu bên trái');
    assert.equal(await page.locator('#tabbar [data-go="settings"]').count(), 1, 'Cài đặt ở navbar');
    assert.equal(await page.locator('#tabbar [data-go="security"]').count(), 1, 'Bảo mật ở navbar');
    assert.equal(await page.locator('#tabbar .tab[aria-current="page"]').count(), 1, 'mục hiện tại được đánh dấu');
    const sc = await box(page, '#screen');
    assert.ok(sc.x === 0 && sc.y >= nav.h - 1, `nội dung bắt đầu dưới navbar, không chừa cột trái (đo x=${sc.x}, y=${sc.y})`);
    const mob = await newPage({ size: 390 });
    await fresh(mob);
    const mnav = await box(mob, '#tabbar');
    assert.ok(mnav.y > 500, 'điện thoại: thanh tab vẫn nổi ở DƯỚI (y=' + mnav.y + ')');
    assert.equal(await mob.locator('#tabbar .brand').count(), 0, 'điện thoại: không có thương hiệu trong thanh tab');

    // ---- B. Trang chủ web có hero ảnh thật + "Nên đi tháng này" + tường ảnh (không đơn điệu) ----
    assert.equal(await page.locator('.hero-w .hs img').count(), 3, 'hero có 3 ảnh chuyển mờ');
    assert.match(await txt(page.locator('.hero-eyebrow')), /Tháng \d+ · \d+ nơi ở Hà Giang đang vào mùa đẹp/, 'dòng "mùa đẹp" tính từ dữ liệu thật');
    assert.ok(await page.locator('.mcard').count() >= 1, 'có thẻ nên đi tháng này');
    assert.equal(await page.locator('.wall .wcell').count(), 6, 'tường ảnh 6 ô');
    assert.equal(await page.locator('.hero-w .hs').first().evaluate((e) => getComputedStyle(e).animationName), 'heroSlide', 'hero chuyển ảnh bằng animation');
    await page.locator('#q').fill('xyz không có');
    assert.ok((await box(page, '.hero-w')).h <= 300, 'đang tìm: hero thu nhỏ để thấy kết quả');
    await page.locator('#q').fill('');

    // ---- C. Chuyến đi ở màn rộng: cột phải 520, bản đồ cao hết khung, KHÔNG nhảy cuộn khi chọn ngày ----
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-trip]').first().click();
    await page.locator('.mapbox').waitFor();
    const sb = await box(page, '.sheetbody'), mp = await box(page, '.mapbox');
    assert.ok(Math.abs(sb.w - 520) < 2, `cột phải rộng 520 (đo ${sb.w})`);
    assert.ok(mp.h >= 700, `bản đồ cao gần hết khung (đo ${mp.h})`);
    assert.ok(Math.abs(sb.x + sb.w - 1280) < 2, 'cột phải sát mép phải');
    await page.locator('[data-dtab="ov"]').click();
    const chip = page.locator('.assign .dchip').first();
    await chip.scrollIntoViewIfNeeded();
    const before = await page.locator('.sheet-scroll').evaluate((e) => e.scrollTop);
    assert.ok(before > 200, 'đã cuộn xuống tới mục chưa có ngày (scrollTop ' + before + ')');
    await chip.click();
    await page.waitForTimeout(250);
    const after = await page.locator('.sheet-scroll').evaluate((e) => e.scrollTop);
    assert.ok(after > before - 400 && after > 200, `chọn ngày KHÔNG kéo về đầu trang (trước ${before}, sau ${after})`);

    // ---- D. Ngày trống (chuyến tạo mới) bố cục giống nhau ở ngày 1, 2, 3; cột không co theo nội dung ----
    await page.locator('.mapbox [data-go="trips"]').click();
    await page.locator('[data-act="wizard"]').click();
    for (let i = 0; i < 6; i++) await page.locator('[data-act="wzNext"]').click();
    await page.locator('.mapbox').waitFor();
    const geo = [];
    for (const d of [1, 2, 3]) { await page.locator('[data-dtab="' + d + '"]').click(); await page.waitForTimeout(150); const s2 = await box(page, '.sheetbody'), e2 = await box(page, '.emptyday'); geo.push([Math.round(s2.x), Math.round(s2.w), Math.round(e2.x), Math.round(e2.w)]); }
    assert.deepEqual(geo[0], geo[1], 'ngày 1 và ngày 2 có cùng hình học: ' + JSON.stringify(geo));
    assert.deepEqual(geo[1], geo[2], 'ngày 2 và ngày 3 có cùng hình học');
    assert.ok(geo[0][1] >= 518, 'cột không co lại khi ngày trống (rộng ' + geo[0][1] + ')');
    // thêm một mục tham quan vào ngày 1 rồi quay lại: vẫn đúng
    await page.locator('[data-dtab="1"]').click();
    await page.locator('[data-act="addItem"]').first().click();
    await page.locator('[data-act="newItem:sightseeing"]').click();
    await page.locator('#i-title').fill('Cột cờ thử');
    await page.locator('[data-act="saveItem"]').click();
    await page.waitForTimeout(250);
    const withItem = await box(page, '.sheetbody');
    assert.ok(Math.abs(withItem.w - 520) < 2 && Math.abs(withItem.x - geo[0][0]) < 2, 'thêm mục vào ngày 1 không làm lệch cột');

    // ---- E. Thẻ quẹt ở màn rộng cao hơn rộng (tỉ lệ dọc như điện thoại) ----
    await page.locator('.tab[data-go="explore"]').click();
    await page.locator('[data-go="dest"]').first().click();
    await page.locator('[data-go="deck"]').first().click();
    await page.locator('.deck .card.front').waitFor();
    const card = await box(page, '.deck .card.front');
    assert.ok(card.h / card.w >= 1.3, `thẻ quẹt tỉ lệ dọc (đo ${Math.round(card.w)}×${Math.round(card.h)}, cao/rộng ${(card.h / card.w).toFixed(2)})`);

    // ---- F. Tổng quan ít màu: nút/ô nền màu bão hòa chỉ còn tối đa 3 loại (nút chính, nhãn chờ duyệt, huy hiệu) ----
    await fresh();
    await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-trip]').first().click(); await page.locator('.mapbox').waitFor(); await page.locator('[data-dtab="ov"]').click();
    const colors = await page.evaluate(() => {
      const sat = (rgb) => { const m = rgb.match(/\d+(\.\d+)?/g).map(Number); const [r, g, b] = m; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
      const out = new Map();
      document.querySelectorAll('.tbody .btn, .tbody .pill, .tbody .stat, .tbody .chip, .tbody .next, .float .pill, .float .btn').forEach((e) => { const cs = getComputedStyle(e), c = cs.backgroundColor; const grad = /gradient/.test(cs.backgroundImage); const key = grad ? 'gradient' : c; if (grad || (c !== 'rgba(0, 0, 0, 0)' && sat(c) > 0.3)) out.set(key, (out.get(key) || 0) + 1); });
      return [...out.entries()];
    });
    assert.ok(colors.length <= 4, 'số màu nền bão hòa khác nhau ở Tổng quan ≤ 4, đo ' + colors.length + ': ' + JSON.stringify(colors));
    assert.equal(await page.locator('.tbody .stat').first().evaluate((e) => getComputedStyle(e).backgroundColor), await page.locator('.tbody .stat').nth(2).evaluate((e) => getComputedStyle(e).backgroundColor), 'ba ô thống kê cùng một nền trung tính');

    // ---- G. Chuyển động có thật và tôn trọng giảm chuyển động ----
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('.tab[data-go="explore"]').click();
    assert.ok(await page.locator('#screen').evaluate((e) => e.classList.contains('enter')), 'vào màn có lớp chuyển động (.enter)');
    const dNo = await page.locator('.hero-in h1').evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
    assert.ok(dNo > 0.2, 'hero có animation vào màn (' + dNo + 's)');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const dRe = await page.locator('.hero-in h1').evaluate((e) => parseFloat(getComputedStyle(e).animationDuration));
    assert.ok(dRe < 0.01, 'giảm chuyển động: gần như tức thì (' + dRe + 's)');
    const slideDur = await page.locator('.hero-w .hs').nth(1).evaluate((e) => ({ d: parseFloat(getComputedStyle(e).animationDuration), o: getComputedStyle(e).opacity }));
    assert.ok(slideDur.d < 0.01 && slideDur.o === '0', 'giảm chuyển động: hero đứng yên ở ảnh đầu');
    const first = await page.locator('.hero-w .hs').first().evaluate((e) => getComputedStyle(e).opacity);
    assert.equal(first, '1', 'ảnh đầu hiện rõ khi giảm chuyển động');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const press = await page.locator('.btn').first().evaluate((e) => getComputedStyle(e).transitionProperty);
    assert.match(press, /transform/, 'nút có chuyển tiếp khi bấm');
    await mob.close();
  },
};
