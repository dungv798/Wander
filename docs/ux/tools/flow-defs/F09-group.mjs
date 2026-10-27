// F09 (T10–T12, BẢN THỬ 1b): vào chuyến bằng liên kết + tên hiển thị, liên kết đã tắt, đề nghị xóa kèm lý do và duyệt, tiến độ việc cần làm theo từng người, khung xuất.
// Thiết kế cho Lát 1b: không tính vào backend 1a (po-questions.md C2).
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F09',
  title: 'nhóm (bản thử 1b): vào bằng liên kết, tên hiển thị, đề nghị xóa kèm lý do, tiến độ từng người, xuất',
  size: 390,
  async run({ page, url, assert }) {
    const fresh = async () => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/'); };
    const openTrip = async () => { await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-trip]').first().click(); await page.locator('.mapbox').waitFor(); };
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const readState = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const openShare = async () => { await page.locator('[data-act="shareSheet"]').first().click(); await page.getByRole('dialog').waitFor(); };

    // ---- A. Bật liên kết mời; khung "Lưu hoặc gửi lịch trình" luôn có; bản thử được gắn nhãn ----
    await fresh();
    await openTrip();
    await page.locator('[data-dtab="ov"]').click();
    await openShare();
    assert.match(await txt(page.locator('#panel')), /Bản thử, thiết kế cho Lát 1b/, 'tờ mời có nhãn bản thử 1b');
    if (await page.locator('[data-act="doshare"]').count()) await page.locator('[data-act="doshare"]').click();
    assert.equal(await page.locator('#lnk').count(), 1, 'liên kết mời hiện sau khi bật');
    assert.equal(await page.locator('[data-act="exportStub"]').count(), 3, 'có 3 lối xuất: Ảnh, PDF, Thêm vào lịch');
    await page.locator('[data-act="exportStub"]').first().click();
    await page.locator('h1', { hasText: 'Lưu hoặc gửi lịch trình' }).waitFor();
    assert.match(await page.locator('.warnbox').textContent(), /BẢN THỬ/, 'lối xuất nói thật là chưa tạo tệp (xem trước, F19)');
    await page.locator('.pagehead [data-go="trip"]').click();
    await page.locator('.mapbox').waitFor();
    await openShare();

    // ---- B. Người được mời mở liên kết: quyền nói rõ; tên rỗng/trùng bị chặn; tên hợp lệ thì vào chuyến ----
    await page.locator('[data-act="protoJoin"]').click();
    const joinTxt = await txt(page.locator('#panel'));
    assert.match(joinTxt, /Bạn được mời vào/, 'tiêu đề lời mời');
    assert.match(joinTxt, /Không cần tài khoản/, 'nói rõ không cần tài khoản');
    assert.match(joinTxt, /gửi đề nghị, người tạo duyệt/, 'nói rõ quyền xóa của thành viên (Q-c)');
    await page.locator('#j-name').fill('   ');
    await page.locator('[data-act="joinGo"]').click();
    assert.match(await txt(page.locator('#j-warn')), /Hãy nhập tên/, 'tên rỗng: báo lỗi gần ô nhập');
    await page.locator('#j-name').fill('bạn');
    await page.locator('[data-act="joinGo"]').click();
    assert.match(await txt(page.locator('#j-warn')), /Tên này đã được dùng hoặc dành riêng/, 'trùng tên người tạo (không phân biệt hoa thường): báo lỗi');
    for (const fake of ['Ba\u0323n', 'B\u200ban', 'BẠN.', 'Người tạo', 'Ban']) {   // NFD, ký tự rộng 0, dấu câu, tên dành riêng, không dấu
      await page.locator('#j-name').fill(fake);
      await page.locator('[data-act="joinGo"]').click();
      assert.match(await txt(page.locator('#j-warn')), /Tên này đã được dùng hoặc dành riêng/, 'giả mạo người tạo bị chặn: ' + JSON.stringify(fake));
    }
    await page.locator('#j-name').fill('🙂');
    await page.locator('[data-act="joinGo"]').click();
    assert.match(await txt(page.locator('#j-warn')), /Hãy nhập tên \(chữ hoặc số\)/, 'chỉ có biểu tượng, không có chữ/số: báo lỗi');
    await page.locator('#j-name').fill('Lan  Anh');
    await page.locator('[data-act="joinGo"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Chào Lan Anh/, 'vào chuyến, khoảng trắng thừa được gọn');
    assert.match(await txt(page.locator('.simbar')), /Thành viên \(Lan Anh\)/, 'thanh bản thử dùng tên mới');
    const st = await readState();
    assert.equal(st.memberName, 'Lan Anh', 'tên lưu lại');
    assert.equal(st.role, 'member', 'đang xem với tư cách thành viên');
    assert.equal(JSON.stringify(st).includes('"Bình"'), false, 'mọi dấu vết tên cũ "Bình" đã được đổi theo (mục thêm, đề nghị, thùng rác)');
    assert.equal(st.trips[0].items.filter((i) => i.addedBy === 'Lan Anh').length >= 1, true, 'mục do thành viên thêm mang tên mới (không bị xóa trắng)');
    // mục do chính mình thêm: ở chi tiết địa điểm là "Xóa" trực tiếp, không phải "Đề nghị xóa" (cùng kết quả với vuốt và form sửa)
    await page.locator('[data-dtab="ov"]').click();
    await page.locator('[data-item-open]').filter({ hasText: 'Phố cổ Đồng Văn' }).first().click();
    assert.equal(await page.locator('#panel').getByRole('button', { name: 'Xóa', exact: true }).count(), 1, 'mục của chính mình: nút "Xóa"');
    assert.equal(await page.locator('#panel').getByRole('button', { name: 'Đề nghị xóa' }).count(), 0, 'mục của chính mình: không có "Đề nghị xóa"');
    await page.keyboard.press('Escape');

    // ---- C. Thành viên đề nghị xóa mục của người khác: ô lý do (không bắt buộc, ≤ 200); Hoàn tác; người tạo thấy lý do ----
    await page.locator('[data-dtab="ov"]').click();
    const other = page.locator('[data-item-open]').filter({ hasText: 'Hoàng Su Phì' }).first();
    await other.click();
    await page.locator('#panel').getByRole('button', { name: 'Đề nghị xóa' }).click();
    await page.locator('#q-reason').waitFor();
    assert.equal(await page.locator('#q-reason').getAttribute('maxlength'), '200', 'lý do tối đa 200 ký tự');
    assert.match(await txt(page.locator('#panel')), /Mục vẫn ở trong chuyến cho tới khi họ đồng ý/, 'nói rõ mục chưa bị xóa');
    await page.locator('#q-reason').fill('Xa quá,  đi mất cả ngày');
    await page.locator('[data-act^="reqSend:"]').click();
    await page.locator('#undoBtn').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Đã gửi đề nghị xóa cho người tạo/, 'thông báo đã gửi');
    const reqs = (await readState()).trips[0].items.filter((i) => i.removal && i.removal.status === 'pending' && i.removal.by === 'Lan Anh');
    assert.equal(reqs.length >= 1, true, 'đề nghị ghi đúng tên người gửi');
    assert.equal(reqs.some((i) => i.removal.reason === 'Xa quá, đi mất cả ngày'), true, 'lý do được gọn khoảng trắng');
    // đề nghị không lý do
    const other2 = page.locator('[data-item-open]').filter({ hasText: 'Tây Côn Lĩnh' }).first();
    await other2.click();
    await page.locator('#panel').getByRole('button', { name: 'Đề nghị xóa' }).click();
    await page.locator('[data-act^="reqSend:"]').click();
    assert.equal((await readState()).trips[0].items.some((i) => i.removal && i.removal.reason === 'Không ghi lý do.'), true, 'để trống lý do: ghi "Không ghi lý do."');
    // người tạo mở duyệt và thấy lý do
    await page.locator('[data-role="owner"]').click();
    assert.match(await txt(page.locator('#screen')), /Lan Anh đề nghị xóa/, 'người tạo thấy ai đề nghị');

    // ---- D. Liên kết đã tắt: màn lỗi rõ ràng, không đẩy người dùng vào ngõ cụt ----
    await openShare();
    await page.locator('[data-act="protoJoinOff"]').click();
    assert.match(await txt(page.locator('#panel [role="alert"]')), /Người tạo chuyến đã tắt liên kết mời/, 'giải thích vì sao và làm gì tiếp');
    await page.locator('#panel').getByRole('button', { name: 'Đã hiểu' }).click();

    // ---- E. Tiến độ việc cần làm theo từng người: không tích hộ người khác ----
    await page.locator('[data-dtab="2"]').click();   // việc cần làm nằm ở Ngày 2
    const chip = (await txt(page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' }).first())).match(/Xong (\d)\/(\d) người/);
    assert.ok(chip, 'việc cần làm có chip tiến độ khi chuyến có nhiều người');
    const done0 = Number(chip[1]);
    await page.locator('[data-act^="task:"]').first().click();
    const chip1 = (await txt(page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' }).first())).match(/Xong (\d)\/(\d) người/);
    assert.equal(Number(chip1[1]), done0 + 1, 'người tạo tích phần của mình: +1, không đụng phần người khác');
    await page.locator('.swipe').filter({ hasText: 'Đổ xăng trước khi lên đèo' }).first().locator('.irow').click();
    await page.locator('#panel .who').waitFor();
    const who = await txt(page.locator('#panel .who'));
    assert.match(who, /Bạn \(người tạo\)\s*Đã xong/, 'danh sách từng người: người tạo đã xong');
    assert.match(who, /Lan Anh\s*Chưa xong/, 'thành viên chưa xong (tích hộ không có)');
    assert.match(await txt(page.locator('#panel')), /Mỗi người tự tích phần của mình/, 'nói rõ nguyên tắc');
  },
};
