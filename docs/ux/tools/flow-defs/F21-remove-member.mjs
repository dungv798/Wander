// F21 (DG-2 A9, 1b, KHUNG): gỡ thành viên khỏi chuyến đi: xác nhận nêu hệ quả (ĐỀ XUẤT, chưa là quyết định), Hoàn tác.
export default {
  id: 'F21',
  title: 'gỡ thành viên (bản thử 1b): danh sách người đi cùng, hộp xác nhận nêu hệ quả, Hoàn tác',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const KEY = 'wander-kham-pha-proto-v8';
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-trip]').first().click(); await page.locator('.mapbox').waitFor();
    await page.locator('[data-dtab="ov"]').click();
    const openShare = async () => { await page.locator('[data-act="shareSheet"]').first().click(); await page.getByRole('dialog').waitFor(); };
    await openShare();
    if (await page.locator('[data-act="doshare"]').count()) await page.locator('[data-act="doshare"]').click();
    await page.locator('[data-act="protoJoin"]').click();
    await page.locator('#j-name').fill('Lan Anh');
    await page.locator('[data-act="joinGo"]').click();
    await page.locator('.mapbox').waitFor();
    await page.locator('[data-role="owner"]').click();
    await openShare();

    // ---- 0. Thành viên KHÔNG thấy danh sách gỡ người (chỉ người tạo; đề xuất, Q6–Q9 mở) ----
    await page.keyboard.press('Escape');
    await page.locator('[data-role="member"]').click();
    await openShare();
    assert.equal(await page.locator('[data-act^="rmMember:"]').count(), 0, 'thành viên không thấy nút Gỡ');
    await page.keyboard.press('Escape');
    await page.locator('[data-role="owner"]').click();
    await openShare();

    // ---- A. Danh sách người đi cùng có nút Gỡ có nhãn đầy đủ ----
    const list = page.locator('.seccard:has(h2:text-matches("Người đi cùng"))');
    assert.match(await txt(list), /Người đi cùng \(\d+\)/, 'đếm người đi cùng');
    const btn = list.locator('[data-act^="rmMember:"]').first();
    const who = (await btn.getAttribute('data-act')).split(':')[1];
    assert.match(await btn.getAttribute('aria-label'), /^Gỡ .* khỏi chuyến đi$/, 'nút Gỡ có nhãn nói rõ gỡ ai');

    // ---- B. Hộp xác nhận: nhãn BẢN THỬ, hệ quả nêu rõ, hủy thì không gỡ ----
    await btn.click();
    const t = await txt(page.locator('#panel'));
    assert.match(t, /BẢN THỬ 1b · đề xuất, chưa là quyết định/, 'hệ quả là đề xuất (Q6–Q9 còn mở)');
    assert.match(t, /sẽ không mở được chuyến đi này nữa/, 'nêu mất quyền mở');
    assert.match(t, /vẫn ở lại chuyến đi/, 'nêu mục họ thêm ở lại');
    assert.match(t, /Hoàn tác/, 'nói có Hoàn tác');
    await page.locator('#panel [data-act="closeSheet"]').last().click();
    const stillThere = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k)).trips[0].removed || []).length, KEY);
    assert.equal(stillThere, 0, 'hủy: chưa gỡ ai');

    // ---- C. Gỡ: người đó không còn trong danh sách; Hoàn tác đưa về ----
    await openShare();
    await page.locator('[data-act^="rmMember:"]').first().click();
    await page.locator('[data-act^="rmMemberYes:"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.match(await page.locator('#toast').textContent(), new RegExp('Đã gỡ ' + who), 'báo đã gỡ');
    const removed = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).trips[0].removed, KEY);
    assert.deepEqual(removed, [who], 'ghi người đã gỡ');
    await page.locator('#undoBtn').click();
    const back = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k)).trips[0].removed || []).length, KEY);
    assert.equal(back, 0, 'Hoàn tác: người được đưa về');
  },
};
