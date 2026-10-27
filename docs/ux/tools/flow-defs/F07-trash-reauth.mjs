// F07 (T7): xóa → Hoàn tác → "Đã xóa gần đây" (giữ đến khi xóa tay) → khôi phục / xóa vĩnh viễn từng mục chỉ cần xác nhận (DR-011 A2/B1; D19, D25). Kiểm tra xác thực lại nằm ở F08.
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F07',
  title: 'xóa/Hoàn tác, Đã xóa gần đây (không hết hạn), khôi phục, xóa vĩnh viễn từng mục (không xác thực lại)',
  size: 390,
  async run({ page, url, assert }) {
    const fresh = async () => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/'); };
    const openTrip = async () => { await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-trip]').first().click(); await page.locator('.mapbox').waitFor(); };
    const openTrash = async () => { await page.locator('[data-dtab="ov"]').click(); await page.locator('[data-go="trash"]').click(); await page.locator('h1', { hasText: 'Đã xóa gần đây' }).waitFor(); };
    const rows = () => page.locator('.trashrow');
    const readState = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();

    // ---- A. Xóa mục của chính mình: vào "Đã xóa gần đây", Hoàn tác đưa về đúng chỗ ----
    await fresh();
    await openTrip();
    await page.locator('[data-dtab="2"]').click();
    const before = await page.locator('.swipe h3').allTextContents();
    await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).locator('.irow').click();
    await page.locator('#i-title').waitFor();
    await page.locator('#panel').getByRole('button', { name: 'Xóa mục này' }).click();
    await page.locator('#undoBtn').waitFor();
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).count(), 0, 'mục đã xóa khỏi ngày');
    await page.locator('#undoBtn').click();
    assert.deepEqual(await page.locator('.swipe h3').allTextContents(), before, 'Hoàn tác trả đúng thứ tự cũ');
    await page.locator('[data-dtab="ov"]').click();
    assert.match(await txt(page.locator('[data-go="trash"]')), /Đã xóa gần đây \(2\)/, 'Hoàn tác không để lại bản sao trong thùng rác (vẫn 2 mục mẫu)');

    // ---- B. Trang "Đã xóa gần đây": nội dung, giữ đến khi xóa tay (DR-011 A2), trạng thái ----
    await openTrash();
    assert.equal(await rows().count(), 2, 'chuyến mẫu có 2 mục đã xóa');
    const t0 = await txt(rows().nth(0)), t1 = await txt(rows().nth(1));
    assert.ok(/Mua áo mưa/.test(t0) && /5 ngày trước/.test(t0), 'mục xóa 5 ngày trước: ' + t0);
    assert.ok(/29 ngày trước/.test(t1), 'mục xóa 29 ngày trước: ' + t1);
    assert.equal(/còn \d+ ngày/.test(t0 + t1), false, 'không có đếm ngược: thùng rác không tự hết hạn');
    assert.match(await txt(page.locator('.pagehead')), /giữ ở đây đến khi bạn xóa vĩnh viễn/, 'nói rõ giữ đến khi xóa tay');
    assert.equal(/xác thực lại/.test(await txt(page.locator('.pagehead'))), false, 'xóa từng mục không nhắc xác thực lại (DR-011 B1)');

    // ---- C. Khôi phục về đúng ngày; Hoàn tác đưa lại vào thùng rác ----
    await rows().nth(0).locator('[data-act^="restore:"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.equal(await rows().count(), 1, 'khôi phục: còn 1 mục trong thùng rác');
    await page.locator('#undoBtn').click();
    assert.equal(await rows().count(), 2, 'Hoàn tác khôi phục: lại 2 mục trong thùng rác');
    await rows().nth(0).locator('[data-act^="restore:"]').click();
    await page.locator('[data-go="trip"]').first().click();
    await page.locator('[data-dtab="1"]').click();
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Mua áo mưa' }).count(), 1, '«Mua áo mưa» về lại Ngày 1');

    // ---- D. Khôi phục khi ngày cũ không còn trong chuyến: về "Chưa có ngày" ----
    await page.locator('[data-act="editTrip"]').click();
    const s0 = await page.locator('#e-start').inputValue();
    const d1 = new Date(s0 + 'T00:00:00Z'); d1.setUTCDate(d1.getUTCDate() + 1);
    await page.locator('#e-end').fill(d1.toISOString().slice(0, 10));   // còn 2 ngày: Ngày 3 bị cắt (trống nên không cảnh báo)
    await page.locator('[data-act="doEdit"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    await openTrash();
    await rows().filter({ hasText: 'Cổng trời' }).locator('[data-act^="restore:"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /vào Chưa có ngày \(ngày cũ không còn trong chuyến\)/, 'khôi phục khi ngày bị cắt: về Chưa có ngày và nói rõ lý do');

    // ---- E. Xóa vĩnh viễn từng mục: chỉ hộp xác nhận, KHÔNG xác thực lại (DR-011 B1); hủy thì không xóa gì ----
    await page.locator('[data-go="trip"]').first().click();
    await page.locator('[data-dtab="2"]').click();
    await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).locator('.irow').click();
    await page.locator('#panel').getByRole('button', { name: 'Xóa mục này' }).click();
    await page.locator('#undoBtn').waitFor();
    await openTrash();
    assert.equal(await rows().count(), 1, 'thùng rác có «Nghỉ trưa»');
    await rows().first().locator('[data-act^="purge:"]').click();
    await page.locator('#panel').getByText('Xóa vĩnh viễn «Nghỉ trưa»?').waitFor();
    assert.equal(await page.locator('[data-act="reauthMode:device"]').count(), 0, 'không có lựa chọn xác thực lại');
    assert.equal(await page.locator('[data-act="reauthMode:code"]').count(), 0, 'không đòi mã khôi phục');
    assert.match(await txt(page.locator('#panel')), /không cần xác thực lại/, 'nói rõ không cần xác thực lại');
    await page.locator('#panel [data-act="closeSheet"]').last().click();
    assert.equal(await rows().count(), 1, 'hủy: không xóa gì');
    await rows().first().locator('[data-act^="purge:"]').click();
    await page.locator('[data-act^="purgeYes:"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Đã xóa vĩnh viễn «Nghỉ trưa»/, 'xác nhận: xóa vĩnh viễn');
    assert.equal(await rows().count(), 0, 'thùng rác trống');
    assert.match(await txt(page.locator('.empty')), /Chưa có mục nào bị xóa/, 'trạng thái rỗng của thùng rác');
    assert.equal(/30 ngày/.test(await txt(page.locator('.empty'))), false, 'trạng thái rỗng không nhắc 30 ngày');

    // ---- K. Dời lịch +1 ngày: mục trong thùng rác dời theo, khôi phục về ĐÚNG ngày (skeptic M1) ----
    await fresh();
    await openTrip();
    await page.locator('[data-dtab="2"]').click();
    await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).locator('.irow').click();
    await page.locator('#panel').getByRole('button', { name: 'Xóa mục này' }).click();
    await page.locator('#undoBtn').waitFor();
    await page.locator('[data-act="editTrip"]').click();
    const k0 = await page.locator('#e-start').inputValue(), k1 = await page.locator('#e-end').inputValue();
    const shift = (iso) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
    await page.locator('#e-start').fill(shift(k0));
    await page.locator('#e-end').fill(shift(k1));
    await page.locator('[data-act="doEdit"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    await openTrash();
    await rows().filter({ hasText: 'Nghỉ trưa' }).locator('[data-act^="restore:"]').click();
    await page.locator('#toast').waitFor();
    await page.locator('[data-go="trip"]').first().click();
    await page.locator('[data-dtab="2"]').click();
    assert.equal(await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).count(), 1, 'dời lịch +1 ngày: «Nghỉ trưa» vẫn về Ngày 2 (không trôi sang Ngày 1)');

    // ---- K2. Dời lịch rồi Hoàn tác: mục đã xóa cũng trở về ngày cũ (skeptic M2) ----
    await fresh();
    await openTrip();
    await page.locator('[data-dtab="2"]').click();
    await page.locator('.swipe').filter({ hasText: 'Nghỉ trưa' }).locator('.irow').click();
    await page.locator('#panel').getByRole('button', { name: 'Xóa mục này' }).click();
    await page.locator('#undoBtn').waitFor();
    const trashDay0 = (await readState()).trips[0].trash.find((e) => e.item.title === 'Nghỉ trưa').day;
    await page.locator('[data-act="editTrip"]').click();
    const m0 = await page.locator('#e-start').inputValue(), m1 = await page.locator('#e-end').inputValue();
    const plus1 = (iso) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
    await page.locator('#e-start').fill(plus1(m0));
    await page.locator('#e-end').fill(plus1(m1));
    await page.locator('[data-act="doEdit"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.notEqual((await readState()).trips[0].trash.find((e) => e.item.title === 'Nghỉ trưa').day, trashDay0, 'sau khi dời: ngày của mục đã xóa dời theo');
    await page.locator('#undoBtn').click();
    assert.equal((await readState()).trips[0].trash.find((e) => e.item.title === 'Nghỉ trưa').day, trashDay0, 'Hoàn tác việc dời lịch: mục đã xóa về đúng ngày cũ, khớp với các mục còn lại');

    // ---- L. Khôi phục về đúng VỊ TRÍ cũ trong ngày (skeptic M2) ----
    await fresh();
    await openTrip();
    await page.locator('[data-dtab="1"]').click();
    const order0 = await page.locator('.swipe h3').allTextContents();
    const mid = order0[1];   // mục thứ 2 của Ngày 1
    await page.locator('.swipe').filter({ hasText: mid }).locator('.irow').click();
    await page.locator('#panel').getByRole('button', { name: /Xóa/ }).first().click();
    await page.locator('#undoBtn').waitFor();
    assert.equal((await page.locator('.swipe h3').allTextContents()).includes(mid), false, 'mục đã xóa khỏi ngày');
    await openTrash();
    await rows().filter({ hasText: mid }).locator('[data-act^="restore:"]').click();
    await page.locator('[data-go="trip"]').first().click();
    await page.locator('[data-dtab="1"]').click();
    assert.deepEqual(await page.locator('.swipe h3').allTextContents(), order0, 'khôi phục: về đúng vị trí cũ, thứ tự ngày giữ nguyên (Trip.restore)');

    // ---- M. Hoàn tác cũ không còn hiệu lực sau một thay đổi mới (skeptic M3) ----
    await page.locator('[data-act="addItem"]').last().click();
    await page.locator('[data-act="newItem:sightseeing"]').click();
    await page.locator('#i-title').fill('Mục thử hoàn tác');
    await page.locator('[data-act="saveItem"]').click();
    await page.locator('#undoBtn').waitFor();
    await page.locator('[data-act="sortToggle"]').click();
    await page.locator('.swipe').filter({ hasText: 'Mục thử hoàn tác' }).locator('[data-act$=":up"]').click();
    assert.equal(await page.locator('#undoBtn').count(), 0, 'sau khi đổi thứ tự, nút Hoàn tác của lần lưu trước biến mất (tránh ghi đè rộng)');

    // ---- J. Mục xóa rất lâu vẫn còn (không tự mất); thành viên không xóa vĩnh viễn ----
    await fresh();
    await page.locator('.tab[data-go="trips"]').click();   // app chỉ ghi localStorage khi có thao tác
    await page.locator('[data-trip]').first().waitFor();
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.trips[0].trash[0].at = Date.now() - 400 * 864e5; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload();
    await openTrip();
    assert.match(await txt(page.locator('[data-go="trash"]')), /Đã xóa gần đây \(2\)/, 'mục xóa 400 ngày trước vẫn còn (DR-011 A2)');
    await openTrash();
    assert.match(await txt(rows().nth(0)), /400 ngày trước/, 'hiện đúng thời điểm xóa');
    await rows().nth(0).locator('[data-act^="restore:"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.equal(await rows().count(), 1, 'mục rất cũ vẫn khôi phục được');
    await page.locator('[data-go="trip"]').first().click();
    await page.locator('[data-role="member"]').click();
    await openTrash();
    assert.equal(await page.locator('[data-act^="purge:"]').count(), 0, 'thành viên không có nút xóa vĩnh viễn');
    assert.equal(await page.locator('[data-act^="restore:"]').count(), 1, 'thành viên khôi phục được');
  },
};
