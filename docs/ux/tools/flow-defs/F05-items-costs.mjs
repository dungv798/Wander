// F05 + F06 (T6): mục tự do/Nghỉ/Việc cần làm, sắp xếp thủ công, chi phí (D17, D18), đặt chỗ, ngân sách.
// Số kỳ vọng tính tay từ chuyến mẫu: tổng = 0 + 30 + 120 + 450 + 150 = 750 nghìn; chưa biết giá = 4 (Đèo Mã Pì Lèng, Phố cổ, Hoàng Su Phì, Tây Côn Lĩnh);
// đã bao gồm = 1 (Cột cờ Lũng Cú); Ngày 1 = 600 nghìn; Ngày 2 = 150 nghìn + 1 chưa biết giá.
export default {
  id: 'F05',
  title: 'mục tự do/nghỉ/việc, chi phí, đặt chỗ, ngân sách, sắp xếp thủ công',
  size: 390,
  async run({ page, url, assert, newPage }) {
    const NB = ' ';
    const fresh = async (p) => { await p.goto(url + '/'); await p.evaluate(() => localStorage.clear()); await p.goto(url + '/'); };
    const openTrip = async (p) => { await p.locator('.tab[data-go="trips"]').click(); await p.locator('[data-trip]').first().click(); await p.locator('.mapbox').waitFor(); };
    // gộp khoảng trắng THƯỜNG (không đụng tới NBSP, vì NBSP trước ₫ là một phần của yêu cầu D17)
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const addItem = async (kind, fields) => {
      await page.locator('[data-act="addItem"]').last().click();
      await page.locator(`[data-act="newItem:${kind === 'free' ? 'sightseeing' : kind}"]`).click();
      await page.locator('#i-day').waitFor();
      if (fields.title !== undefined) await page.locator('#i-title').fill(fields.title);
      if (fields.cost !== undefined) await page.locator('#i-cost').fill(fields.cost);
      if (fields.dur !== undefined) await page.locator('#i-dur').fill(fields.dur);
      if (fields.book) await page.locator(`[data-act="book:${fields.book}"]`).click();
    };

    // ---- A. Tổng quan chi phí của chuyến mẫu ----
    await fresh(page);
    await openTrip(page);
    const box = await txt(page.locator('.costbox'));
    assert.ok(box.includes('750.000' + NB + '₫') && box.includes('tổng phải trả thêm'), 'tổng phải trả thêm = 750.000 ₫: ' + box);
    assert.match(box, /Chưa tính 4 mục chưa biết giá/, '4 mục chưa biết giá');
    assert.match(box, /1 mục đã bao gồm, không cộng vào tổng/, 'đã bao gồm không cộng vào tổng (D18)');
    assert.ok(box.includes('Tham quan: 180.000' + NB + '₫') && box.includes('Ăn uống: 120.000' + NB + '₫') && box.includes('Lưu trú: 450.000' + NB + '₫'), 'tổng theo loại (D13): Tham quan 180.000, Ăn uống 120.000, Lưu trú 450.000: ' + box);
    assert.ok(box.indexOf('Tham quan') < box.indexOf('Ăn uống') && box.indexOf('Ăn uống') < box.indexOf('Lưu trú'), 'các loại theo thứ tự khai báo của ItemType');
    assert.match(box, /Đã đặt 1\/10 mục có đặt chỗ/, 'đặt chỗ: đã đặt 1/10 (Nghỉ và Việc cần làm không có đặt chỗ)');
    assert.match(box, /Chuyến mẫu: mọi số tiền chỉ để minh họa/, 'ghi rõ số tiền của chuyến mẫu chỉ để minh họa');
    assert.equal(await page.evaluate(() => /\d nghìn/.test(document.querySelector('.costbox').textContent)), false, 'tiền hiển thị đầy đủ VND, không rút gọn "nghìn" (D17)');

    // ---- B. Tổng theo ngày ----
    await page.locator('[data-dtab="1"]').click();
    const d1 = await txt(page.locator('.dayhead .s').first());
    assert.ok(d1.includes('600.000' + NB + '₫') && !/chưa biết giá/.test(d1), 'Ngày 1 = 600.000 ₫, không có mục chưa biết giá: ' + d1);
    await page.locator('[data-dtab="2"]').click();
    const d2 = await txt(page.locator('.dayhead .s').first());
    assert.ok(d2.includes('150.000' + NB + '₫') && /\+ 1 chưa biết giá/.test(d2), 'Ngày 2 = 150.000 ₫ + 1 chưa biết giá: ' + d2);

    // ---- C. Thêm mục tự do: kiểm tra đầu vào, lưu, Hoàn tác, tổng cập nhật ----
    await addItem('free', { title: '' });
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /Hãy đặt tên/, 'tên bắt buộc với mục tự do');
    await page.locator('#i-title').fill('Cà phê sáng');
    await page.locator('#i-cost').fill('-5');
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /số nguyên không âm/, 'chi phí âm bị từ chối (D17)');
    await page.locator('#i-cost').fill('12,5');
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /số nguyên không âm/, 'chi phí thập phân bị từ chối');
    assert.equal(await page.locator('#i-cost').locator('..').locator('.hint').textContent(), 'Chỉ nhập số nguyên từ 0 đến 1.000.000.000, đơn vị nghìn đồng.', 'gợi ý lỗi ngay khi gõ (khớp CostInfo.MAX_K)');
    await page.locator('#i-cost').fill('20');
    assert.equal(await page.locator('#i-cost').locator('..').locator('.hint').textContent(), '= 20.000' + NB + '₫', 'gợi ý xem trước "= 20.000 ₫" (có khoảng trắng không ngắt)');
    await page.locator('#i-dur').fill('10081');   // Item.MAX_DURATION_MIN = 7 ngày = 10080 phút
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /0 đến 10080 phút/, 'thời lượng ngoài 0–10080 phút bị từ chối');
    await page.locator('#i-dur').fill('30');
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('#undoBtn').waitFor();
    const row = page.locator('.swipe').filter({ hasText: 'Cà phê sáng' });
    assert.equal(await row.count(), 1, 'mục tự do xuất hiện ở Ngày 2 (ngày đang xem)');
    assert.ok((await txt(row)).includes('20.000' + NB + '₫') && /30 phút/.test(await txt(row)), 'dòng mục hiện chi phí và thời lượng');
    assert.ok((await txt(page.locator('.dayhead .s').first())).includes('170.000' + NB + '₫'), 'tổng Ngày 2 cập nhật 170.000 ₫');
    await page.locator('#undoBtn').click();
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Cà phê sáng' }).count(), 0, 'Hoàn tác gỡ mục vừa thêm');

    // ---- D. Ngữ nghĩa D18: trống = chưa biết, 0 = biết là 0, đã bao gồm không cộng vào tổng ----
    await addItem('free', { title: 'Quà lưu niệm' });          // cost trống
    await page.locator('[data-act="saveItem"]').click();
    let r1 = page.locator('.swipe').filter({ hasText: 'Quà lưu niệm' });
    assert.match(await txt(r1), /Chưa biết giá/, 'cost trống = "Chưa biết giá"');
    await addItem('free', { title: 'Vé tham quan', cost: '0' });  // cost 0
    await page.locator('[data-act="saveItem"]').click();
    const r0 = page.locator('.swipe').filter({ hasText: 'Vé tham quan' });
    assert.ok((await txt(r0)).includes('0' + NB + '₫') && !/Chưa biết giá/.test(await txt(r0)), 'cost 0 = đã biết là 0 ₫, không phải chưa biết');
    await page.locator('[data-dtab="ov"]').click();
    const ov2 = await txt(page.locator('.costbox'));
    assert.match(ov2, /Chưa tính 5 mục chưa biết giá/, 'mục trống tăng "chưa biết giá" (4→5), mục 0 thì không');
    assert.ok(ov2.includes('750.000' + NB + '₫'), 'tổng vẫn 750.000 ₫ (0 và trống không đổi tổng)');
    await page.locator('[data-dtab="2"]').click();
    await page.locator('.swipe').filter({ hasText: 'Quà lưu niệm' }).locator('.irow').click();
    await page.locator('#i-inc').waitFor();
    await page.locator('#i-inc').check();
    assert.equal(await page.locator('#i-cost').isVisible(), true, 'đã bao gồm: vẫn giữ ô chi phí (backend giữ costK, chỉ không cộng vào tổng)');
    assert.equal(await page.locator('#i-ref-wrap').isVisible(), true, 'đã bao gồm: hiện ô giá tham khảo');
    await page.locator('#i-ref').fill('80');
    await page.locator('[data-act="book:booked"]').click();
    assert.equal(await page.locator('[data-act="book:booked"]').getAttribute('aria-pressed'), 'true', 'chọn Đã đặt');
    assert.equal(await page.locator('[data-act="book:pending"]').getAttribute('aria-pressed'), 'false', 'hai trạng thái Chờ xác nhận / Đã đặt loại trừ nhau (DR-003)');
    await page.locator('[data-act="saveItem"]').click();
    r1 = page.locator('.swipe').filter({ hasText: 'Quà lưu niệm' });
    assert.ok((await txt(r1)).includes('Đã bao gồm, tham khảo 80.000' + NB + '₫') && /Đã đặt/.test(await txt(r1)), 'dòng: Đã bao gồm + tham khảo + Đã đặt');
    await page.locator('[data-dtab="ov"]').click();
    const ov3 = await txt(page.locator('.costbox'));
    assert.match(ov3, /2 mục đã bao gồm/, 'đã bao gồm 1→2');
    assert.match(ov3, /Chưa tính 4 mục chưa biết giá/, 'mục chuyển sang "đã bao gồm" không còn là chưa biết giá');
    assert.ok(ov3.includes('750.000' + NB + '₫'), 'giá tham khảo KHÔNG cộng vào tổng');
    assert.match(ov3, /Đã đặt 2\/12 mục có đặt chỗ/, 'đặt chỗ 1→2 trên 12 mục có đặt chỗ');

    // ---- D2. Giới hạn khớp backend: CostInfo.MAX_K, ItemText, loại mục điều khiển ô giá/đặt chỗ (D13, A-14) ----
    await page.locator('[data-dtab="2"]').click();
    await addItem('free', { title: 'Giới hạn', cost: '1000000001' });
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /tới 1\.000\.000\.000/, 'chi phí > 1.000.000.000 nghìn bị từ chối');
    assert.equal(await page.locator('#i-title').getAttribute('maxlength'), '200', 'tên tối đa 200 ký tự (ItemText.MAX_TITLE)');
    assert.equal(await page.locator('#i-note').getAttribute('maxlength'), '2000', 'ghi chú tối đa 2000 ký tự (ItemText.MAX_NOTE)');
    assert.equal(await page.locator('#i-type option').count(), 9, '9 loại mục (D13)');
    assert.deepEqual(await page.locator('#i-type option').allTextContents(), ['Tham quan', 'Ăn uống', 'Di chuyển', 'Lưu trú', 'Thuê xe', 'Mua sắm', 'Tour/Combo', 'Nghỉ', 'Việc cần làm'], 'tên và thứ tự 9 loại khớp ItemType');
    await page.locator('#i-type').selectOption('rest');
    assert.equal(await page.locator('#i-priced').isVisible(), false, 'đổi sang Nghỉ: ẩn chi phí và đặt chỗ');
    await page.locator('#i-type').selectOption('lodging');
    assert.equal(await page.locator('#i-priced').isVisible(), true, 'đổi sang Lưu trú: hiện lại');
    assert.deepEqual(await page.locator('[data-act^="book:"]').allTextContents(), ['Chờ xác nhận', 'Đã đặt'], 'đặt chỗ có đúng hai trạng thái (DR-003)');
    assert.equal(await page.locator('[data-act="book:pending"]').getAttribute('aria-pressed'), 'true', 'mặc định Chờ xác nhận');
    await page.locator('[data-act="closeSheet"]').last().click();

    // ---- E. Nghỉ và Việc cần làm: không có ô chi phí/đặt chỗ, không bị tính "chưa biết giá"; việc cần làm đánh dấu xong ----
    await page.locator('[data-dtab="2"]').click();
    await addItem('rest', { title: 'Nghỉ chiều' });
    assert.equal(await page.locator('#i-cost').isVisible(), false, 'Nghỉ không có ô chi phí/đặt chỗ (ItemType.isPriced/supportsBooking)');
    await page.locator('[data-act="saveItem"]').click();
    assert.equal(/Chưa biết giá/.test(await txt(page.locator('.swipe').filter({ hasText: 'Nghỉ chiều' }))), false, 'Nghỉ không bị tính chưa biết giá');
    const task = page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' });
    const chk = task.locator('.taskchk');
    assert.equal(await chk.getAttribute('aria-pressed'), 'false', 'việc cần làm chưa xong');
    await chk.click();
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' }).locator('.taskchk').getAttribute('aria-pressed'), 'true', 'đánh dấu xong');
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' }).locator('.irow.done').count(), 1, 'dòng việc đã xong gạch ngang');
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains('taskchk')), true, 'sau khi bấm, focus ở lại nút đánh dấu');
    await page.waitForFunction(() => /Đã đánh dấu xong/.test(document.getElementById('live').textContent), null, { timeout: 3000 });   // thông báo cho trình đọc màn hình (đặt trễ 30 ms có chủ ý)

    // ---- F. Sắp xếp thủ công (D16): Lên/Xuống, nút ở biên bị khóa, focus và thông báo ----
    await page.locator('[data-dtab="1"]').click();
    const names = async () => page.locator('.swipe h3').allTextContents();
    const before = await names();
    assert.deepEqual(before.slice(0, 2), ['Cao nguyên đá Đồng Văn', 'Dinh thự họ Vương'], 'thứ tự ban đầu của Ngày 1: ' + before.join(' | '));
    await page.locator('[data-act="sortToggle"]').click();
    assert.equal(await page.locator('[data-act^="move:"]').count(), 2 * before.length, 'mỗi mục có nút Lên và Xuống');
    assert.equal(await page.locator('.swipe').first().locator('[data-act$=":up"]').isDisabled(), true, 'mục đầu: Lên bị khóa');
    assert.equal(await page.locator('.swipe').last().locator('[data-act$=":down"]').isDisabled(), true, 'mục cuối: Xuống bị khóa');
    const lunch = page.locator('.swipe').filter({ hasText: 'Ăn trưa (mẫu)' });
    await lunch.locator('[data-act$=":up"]').click();
    const after = await names();
    assert.equal(after.indexOf('Ăn trưa (mẫu)'), before.indexOf('Ăn trưa (mẫu)') - 1, 'Ăn trưa lên một vị trí');
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('.swipe')), true, 'sau khi chuyển, focus ở lại đúng hàng');
    await page.waitForFunction(() => /vị trí \d+ trên \d+/.test(document.getElementById('live').textContent), null, { timeout: 3000 });   // thông báo vị trí mới cho trình đọc màn hình
    await page.locator('[data-act="sortToggle"]').click();
    assert.equal(await page.locator('[data-act^="move:"]').count(), 0, 'tắt chế độ sắp xếp: ẩn nút');
    await page.reload();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-dtab="1"]').click();
    assert.deepEqual(await names(), after, 'thứ tự thủ công được lưu qua tải lại');

    // ---- G. Ngân sách và phần vượt ----
    await fresh(page);
    await page.locator('.tab[data-go="trips"]').click();
    await page.locator('[data-act="create"]').first().click();
    await page.locator('#s-budget').fill('700');
    assert.ok((await page.locator('#s-budget').locator('..').locator('.hint').textContent()).includes('= 700.000'), 'xem trước ngân sách = 700.000 ₫');
    await page.locator('[data-act="doCreate"]').click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-dtab="1"]').click();
    await addItem('free', { title: 'Thuê xe', cost: '500' });
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('[data-dtab="ov"]').click();
    let b = await txt(page.locator('.costbox'));
    assert.ok(b.includes('Ngân sách 700.000' + NB + '₫, còn lại 200.000' + NB + '₫'), 'còn lại 200.000 ₫: ' + b);
    assert.equal(await page.locator('.costbox .prog.over').count(), 0, 'chưa vượt: thanh không đỏ');
    await page.locator('[data-dtab="1"]').click();
    await addItem('free', { title: 'Homestay', cost: '300' });
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('[data-dtab="ov"]').click();
    b = await txt(page.locator('.costbox'));
    assert.ok(b.includes('Vượt ngân sách 100.000' + NB + '₫'), 'vượt 100.000 ₫: ' + b);
    assert.equal(await page.locator('.costbox .prog.over').count(), 1, 'vượt: thanh chuyển đỏ');
    assert.equal(await page.locator('.costbox .overnote svg').count() > 0, true, 'vượt: có biểu tượng cảnh báo, không chỉ dùng màu');

    // ---- I. Tương phản thật của chip đang bật và ô biểu tượng, cả sáng lẫn tối (lỗi 25/10: chữ trắng trên nền sáng ở giao diện tối) ----
    const lum = (rgb) => { const [r, g, b] = rgb.match(/[\d.]+/g).slice(0, 3).map((v) => { v = Number(v) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    for (const scheme of ['light', 'dark']) {
      const p2 = await newPage({ size: 390, scheme });
      await fresh(p2);
      await p2.locator('.tab[data-go="trips"]').click();
      await p2.locator('[data-trip]').first().click();
      await p2.locator('.mapbox').waitFor();
      await p2.locator('[data-dtab="1"]').click();
      await p2.locator('[data-act="sortToggle"]').click();
      const chip = await p2.locator('[data-act="sortToggle"]').evaluate((el) => { const s = getComputedStyle(el); return { c: s.color, b: s.backgroundColor }; });
      assert.ok(ratio(chip.c, chip.b) >= 4.5, scheme + ': chip "Xong sắp xếp" tương phản ' + ratio(chip.c, chip.b).toFixed(2) + ' (' + chip.c + ' trên ' + chip.b + ')');
      await p2.locator('[data-dtab="2"]').click();
      const tile = await p2.locator('.ktile').first().evaluate((el) => { const s = getComputedStyle(el); return { c: s.color, b: s.backgroundColor }; });
      assert.ok(ratio(tile.c, tile.b) >= 3, scheme + ': biểu tượng mục khác tương phản ' + ratio(tile.c, tile.b).toFixed(2) + ' (cần ≥ 3:1)');
      await p2.close();
    }

    // ---- H. Tờ sửa mục không tràn ngang ở 390 ----
    await page.locator('[data-dtab="1"]').click();
    await page.locator('.swipe').filter({ hasText: 'Thuê xe' }).locator('.irow').click();
    await page.locator('#i-title').waitFor();
    const over = await page.evaluate(() => { const p = document.getElementById('panel'); return p.scrollWidth - p.clientWidth; });
    assert.ok(over <= 0, 'tờ sửa mục không tràn ngang, tràn ' + over + ' px');

    // ---- J. Đổi loại sang Nghỉ/Việc cần làm khi mục đang có giá: cảnh báo, xác nhận mới xóa (skeptic M4) ----
    await fresh(page);
    await openTrip(page);
    await page.locator('[data-dtab="1"]').click();
    await page.locator('.swipe').filter({ hasText: 'Homestay Đồng Văn (mẫu)' }).locator('.irow').click();
    await page.locator('#i-type').selectOption('rest');
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /sẽ xóa chi phí, giá tham khảo và trạng thái đặt chỗ/, 'cảnh báo trước khi xóa dữ liệu giá');
    assert.equal(await page.locator('#sheet:not([hidden])').count(), 1, 'chưa lưu: tờ vẫn mở');
    await page.locator('#i-type').selectOption('lodging');
    await page.locator('#i-type').selectOption('rest');
    await page.locator('[data-act="saveItem"]').click();
    assert.match(await txt(page.locator('#i-warn')), /sẽ xóa chi phí/, 'đổi lại rồi đổi nữa: cảnh báo lại (không nhớ xác nhận cũ)');
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('#undoBtn').waitFor();
    await page.locator('[data-dtab="ov"]').click();
    assert.ok((await txt(page.locator('.costbox'))).includes('300.000' + NB + '₫'), 'sau xác nhận: tổng giảm 450.000 (750 → 300)');

    // ---- K. R4: bỏ tick "đã bao gồm" thì giá tham khảo bị xóa; tick lại không có lại ----
    await fresh(page);
    await openTrip(page);
    await page.locator('[data-dtab="1"]').click();
    await page.locator('.swipe').filter({ hasText: 'Cột cờ Lũng Cú' }).locator('.irow').click();
    await page.locator('[data-act^="editItem:"]').click();
    assert.equal(await page.locator('#i-ref').inputValue(), '25', 'giá tham khảo mẫu 25');
    await page.locator('#i-inc').uncheck();
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('#undoBtn').waitFor();
    await page.locator('.swipe').filter({ hasText: 'Cột cờ Lũng Cú' }).locator('.irow').click();
    await page.locator('[data-act^="editItem:"]').click();
    await page.locator('#i-inc').check();
    assert.equal(await page.locator('#i-ref').inputValue(), '', 'bỏ tick rồi tick lại: giá tham khảo đã bị xóa (R4)');
  },
};
