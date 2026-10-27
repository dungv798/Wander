// F02 (T8): người mới khám phá không cần gì; lưu lần đầu → danh tính ẩn danh → mã khôi phục hiện MỘT lần → nhập lại hoặc bỏ qua có cảnh báo (D26, QĐ-5, MĐ-2, MĐ-4).
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F02',
  title: 'người mới lưu lần đầu: danh tính, mã khôi phục, nhập lại, bỏ qua có cảnh báo',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const readState = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const startFresh = async () => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/?fresh=1&intro=0'); await page.locator('.sky, .hero-w').first().waitFor(); };
    const pickTwo = async () => {
      await page.locator('.dcard').click();
      await page.locator('[data-go="deck"]').click();
      await page.locator('.card.front').waitFor();
      for (let i = 0; i < 2; i++) { const id = await page.locator('.card.front').getAttribute('data-id'); await page.locator('[data-act="like"]').click(); await page.waitForFunction((x) => document.querySelector('.card.front')?.dataset.id !== x, id); }
      await page.locator('.deckbar .pill').click();
      await page.locator('.grid .tile').first().waitFor();
    };
    const startSave = async () => { await page.locator('[data-act="create"]').first().click(); await page.locator('#s-name').waitFor(); await page.locator('[data-act="doCreate"]').click(); };

    // ---- A. Khám phá không cần danh tính; có lối "Đã có chuyến đi?" cho người đã có ----
    await startFresh();
    assert.equal(await page.locator('[data-go="recover"]').count(), 1, 'người mới thấy lối "Đã có chuyến đi? Mở trên máy này"');
    await pickTwo();
    assert.equal(await page.locator('.grid .tile').count(), 2, 'chọn được 2 nơi mà không cần danh tính');

    // ---- B. Lưu lần đầu: giải thích bằng chữ thường ngày; "Để sau" không tạo gì ----
    await startSave();
    await page.locator('#panel').getByText('Lưu chuyến đi của bạn').waitFor();
    const intro = await txt(page.locator('#panel'));
    assert.match(intro, /danh tính ẩn danh/, 'nói rõ là danh tính ẩn danh');
    assert.match(intro, /Không cần email hay số điện thoại/, 'nói rõ không thu email/số điện thoại (QĐ-1)');
    assert.match(intro, /mã khôi phục/, 'giải thích mã khôi phục');
    assert.match(intro, /một lần/, 'nói rõ mã chỉ hiện một lần');
    assert.match(intro, /mất máy là mất chuyến đi/, 'cảnh báo nhẹ một dòng: chưa có mã thì mất máy là mất chuyến đi');
    assert.equal(await page.locator('#panel .skipnote').count(), 1, 'đúng MỘT dòng cảnh báo (PO 26/10/2026)');
    await page.keyboard.press('Escape');
    await page.locator('.tab[data-go="trips"]').click();
    assert.match(await txt(page.locator('#screen')), /Chưa có chuyến đi/, 'đóng tờ bằng Esc: chưa tạo chuyến nào');
    await page.locator('.tab[data-go="picked"]').click();
    assert.equal(await page.locator('.grid .tile').count(), 2, 'đóng tờ bằng Esc: 2 nơi đã chọn vẫn còn');

    // ---- C. Mã mới chưa có hiệu lực: Esc/chạm nền bị khóa ở bước hiện mã; Hủy thì không tạo danh tính hay chuyến ----
    await startSave();
    await page.locator('[data-act="idCreate"]').click();
    await page.locator('#newcode').waitFor();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#sheet:not([hidden]) #newcode').count(), 1, 'Esc KHÔNG đóng tờ khi đang hiện mã (mã mới chưa có hiệu lực)');
    assert.match(await page.locator('#toast').textContent(), /Mã mới chưa có hiệu lực/, 'Esc: giải thích vì sao không đóng');
    await page.mouse.click(5, 5);   // chạm nền
    assert.equal(await page.locator('#sheet:not([hidden]) #newcode').count(), 1, 'chạm nền KHÔNG đóng tờ khi đang hiện mã');
    await page.locator('[data-act="codeCancel"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#newcode').count(), 0, 'đóng xong: mã không còn trong DOM');
    await page.locator('.tab[data-go="trips"]').click();
    assert.match(await txt(page.locator('#screen')), /Chưa có chuyến đi/, 'Hủy: không tạo chuyến');
    await page.locator('[data-go="security"]').click();
    assert.match(await txt(page.locator('#screen')), /Chưa có danh tính/, 'Hủy: không tạo danh tính nửa vời');

    // ---- D. Đường đầy đủ: hiện mã → sao chép → bỏ qua có cảnh báo → quay lại cùng mã → nhập lại sai → đúng → vào chuyến ----
    await page.locator('.tab[data-go="picked"]').click();
    await startSave();
    await page.locator('[data-act="idCreate"]').click();
    await page.locator('#newcode').waitFor();
    const code = (await page.locator('#newcode').textContent()).trim();
    assert.match(code, /^([0-9A-HJKMNP-TV-Z]{5}-){5}[0-9A-HJKMNP-TV-Z]{5}$/, 'mã đúng định dạng backend (30 ký hiệu Crockford, 6 nhóm × 5): ' + code);
    assert.match(await txt(page.locator('#panel')), /Mã chỉ hiện một lần/, 'cảnh báo mã chỉ hiện một lần');
    await page.locator('[data-act="codeCopy"]').click();
    await page.waitForFunction(() => /Đã sao chép mã|Không sao chép tự động được/.test(document.getElementById('toast').textContent), null, { timeout: 5000 });   // chờ đúng thông báo sao chép (không nhầm với thông báo cũ)
    assert.match(await txt(page.locator('#panel')), /mất quyền với chuyến đi vĩnh viễn/, 'màn hiện mã vẫn nói rõ hậu quả mất mã (QĐ-5)');
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill('AAAA-BBBB-CCCC');
    await page.locator('[data-act="codeConfirm"]').click();
    assert.match(await txt(page.locator('#c-warn')), /chưa khớp/, 'nhập lại sai: không tạo');
    assert.equal(await page.locator('.mapbox').count(), 0, 'chưa vào chuyến khi chưa xác nhận');
    await page.locator('[data-act="codeBack"]').click();
    assert.equal((await page.locator('#newcode').textContent()).trim(), code, 'xem lại mã: vẫn cùng mã');
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill(code.toLowerCase().replace(/-/g, ' '));
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    assert.equal((await readState()).identity.code, code, 'nhập lại đúng: mã có hiệu lực NGAY, trước khi bấm Xong');
    assert.match(await txt(page.locator('#panel')), /Đã lưu mã khôi phục/, 'có bước Đã lưu mã');
    assert.equal((await page.locator('#savedcode').textContent()).replace(/\s|-/g, ''), code.replace(/-/g, ''), 'cho xem lại ĐÚNG mã vừa xác nhận');
    assert.equal(await page.locator('[data-act="codeCopy"]').count(), 1, 'sao chép được');
    assert.equal(await page.locator('[data-act="codePrint"]').count(), 1, 'in được');
    assert.equal(await page.locator('[data-act="codeDone"]').count(), 1, 'có nút Xong');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act="codeDownload"]').click()]);
    assert.equal(dl.suggestedFilename(), 'wander-ma-khoi-phuc.txt', 'tải về tệp .txt');
    assert.equal(await page.locator('.mapbox').count(), 0, 'chưa vào chuyến khi chưa bấm Xong');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#savedcode').count(), 1, 'Esc không đóng bước Đã lưu mã (phải bấm Xong)');
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('.mapbox').waitFor();
    const st = await readState();
    assert.equal(st.identity.code, code, 'xác nhận xong: mã có hiệu lực');
    assert.equal(st.trips.length, 1, 'tạo đúng 1 chuyến');
    assert.equal(st.trips[0].items.length, 2, 'chuyến có 2 nơi đã chọn');
    assert.equal(st.identity.devices.length, 1, 'danh tính mới có đúng 1 thiết bị tin cậy (thiết bị này)');
    assert.equal(page.url().includes(code), false, 'mã không nằm trong URL');
    assert.equal((await page.title()).includes(code), false, 'mã không nằm trong tiêu đề trang');
    assert.equal((await txt(page.locator('body'))).includes(code), false, 'sau khi xong, mã không còn hiện ở đâu trên trang');

    // ---- E. Bỏ qua mã (QĐ-5) rồi phát hành sau (MĐ-2) ----
    await startFresh();
    await pickTwo();
    await startSave();
    await page.locator('[data-act="idCreate"]').click();
    await page.locator('[data-act="codeSkip"]').click();   // một chạm, không hộp xác nhận
    await page.locator('.mapbox').waitFor();
    assert.equal((await readState()).identity.code, null, 'để sau: danh tính chưa có mã');
    assert.equal((await readState()).trips.length, 1, 'để sau KHÔNG phải hủy: chuyến đi vẫn được lưu');
    assert.match(await page.locator('#toast').textContent(), /Đã lưu chuyến đi\. Bạn chưa có mã khôi phục/, 'nói rõ chuyến đã lưu và mã làm sau ở Bảo mật');
    await page.locator('[data-go="trips"]').first().click();
    assert.match(await txt(page.locator('.nocode')), /Chưa có mã khôi phục: mất máy là mất chuyến đi/, 'danh sách chuyến còn một dòng nhắc nhẹ khi chưa có mã (không chỉ thông báo 1 lần)');
    await page.locator('.nocode').click();
    assert.match(await txt(page.locator('.seccard').first()), /Bạn chưa có mã khôi phục/, 'trang Bảo mật nhắc chưa có mã');
    await page.locator('[data-act="issueNow"]').click();
    await page.locator('#newcode').waitFor();
    const late = (await page.locator('#newcode').textContent()).trim();
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill(late);
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await txt(page.locator('.seccard').first()), /Bạn đã có mã khôi phục/, 'phát hành sau: đã có mã');
    assert.equal((await readState()).identity.code, late, 'mã phát hành sau có hiệu lực');
  },
};
