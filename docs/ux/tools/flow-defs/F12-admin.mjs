// F12 (T14): cổng quản trị nội dung, BẢN THỬ mức khung. Đăng nhập chưa chốt (Q-d). Luật chất lượng chặn xuất bản; bản nháp; rời khỏi form chưa lưu; hết phiên không mất bản nháp.
export default {
  id: 'F12',
  title: 'quản trị: khung đăng nhập, danh sách, form địa điểm, kiểm tra chất lượng, bản nháp, hết phiên',
  size: 1280,
  async run({ page, url, assert, newPage }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const fresh = async (p = page) => { await p.goto(url + '/admin.html'); await p.evaluate(() => localStorage.clear()); await p.goto(url + '/admin.html'); await p.locator('.alogin').waitFor(); };
    const enter = async (p = page) => { await p.locator('[data-act="enter"]').click(); await p.locator('.alist').waitFor(); };
    const openDest = async (p = page) => { await p.locator('[data-open-dest]').click(); await p.locator('[role="tablist"]').waitFor(); };

    // ---- A. Khung đăng nhập: nói thật là chưa chốt, không giả vờ bảo vệ ----
    await fresh();
    assert.equal(await page.locator('.alogin .btn[disabled]').count(), 1, 'nút Đăng nhập thật bị khóa (cơ chế chưa chốt)');
    assert.match(await txt(page.locator('#a-why')), /Cơ chế đăng nhập quản trị chưa được chốt \(Q-d\)/, 'giải thích vì sao khóa');
    assert.match(await txt(page.locator('.alogin')), /BẢN THỬ/, 'lối vào bản thử được gắn nhãn');
    await enter();
    assert.match(await txt(page.locator('.proto')), /BẢN THỬ · đăng nhập chưa chốt/, 'thanh trên cùng nhắc đang là bản thử');

    // ---- B. Danh sách điểm đến: Hà Giang thật + 6 điểm "sắp ra mắt" chưa có dữ liệu ----
    assert.equal(await page.locator('.arow').count(), 7, '1 điểm đến có dữ liệu + 6 sắp ra mắt');
    assert.match(await txt(page.locator('.arow').first()), /Hà Giang.*9 địa điểm.*9\/9 đủ chuẩn xuất bản.*Đã xuất bản/, 'số liệu lấy từ kho thật');
    assert.equal(await page.locator('[data-act="newDest"]').count(), 6, 'mỗi điểm sắp ra mắt có nút Tạo bản nháp (A5, khung; chi tiết ở F20)');
    await openDest();

    // ---- C. Chi tiết điểm đến: tab bằng bàn phím; kiểm tra chất lượng ban đầu chỉ có cảnh báo (nội dung AI chưa kiểm chứng) ----
    assert.equal(await page.locator('.arow:has(.thumb)').count(), 9, '9 địa điểm');
    assert.equal(await page.locator('#tab-places').getAttribute('aria-selected'), 'true', 'tab Địa điểm đang chọn');
    await page.locator('#tab-places').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-guide').getAttribute('aria-selected'), 'true', 'mũi tên phải: sang tab Cẩm nang');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'tab-guide', 'focus theo tab');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.acard.q').count(), 9, 'tab Kiểm tra: 9 địa điểm đều có cảnh báo "chưa kiểm chứng"');
    assert.equal((await txt(page.locator('.qlist'))).includes('Chặn:'), false, 'không địa điểm nào có lỗi chặn');
    assert.match(await txt(page.locator('.qlist')), /Cảnh báo: Nội dung biên tập đã được người kiểm chứng/, 'cảnh báo đúng ý ADR-009');

    // ---- D. Cẩm nang: sửa chữ, tiêu đề rỗng bị chặn ----
    await page.locator('#tab-guide').click();
    await page.locator('[data-guide]').first().click();
    await page.locator('#g-title').fill('   ');
    await page.locator('[data-act^="saveGuide:"]').click();
    assert.match(await txt(page.locator('#g-warn')), /Tiêu đề không được để trống/, 'tiêu đề rỗng: báo lỗi');
    await page.locator('#g-title').fill('Mùa nên đi (sửa thử)');
    await page.locator('[data-act^="saveGuide:"]').click();
    assert.match(await txt(page.locator('.arow').first()), /Mùa nên đi \(sửa thử\).*Có thay đổi chưa xuất bản/, 'cẩm nang có bản nháp');

    // ---- E. Thêm địa điểm mới: tên bắt buộc; lưu nháp; lỗi chặn nêu rõ; không xuất bản được ----
    await page.locator('#tab-places').click();
    await page.locator('[data-act="newPlace"]').click();
    await page.locator('#p-name').waitFor();
    assert.match(await txt(page.locator('h1')), /Địa điểm mới/, 'tiêu đề form mới');
    assert.equal(await page.locator('.ferr').count(), 0, 'form mới mở ra KHÔNG có sẵn lỗi đỏ (chưa ai làm sai gì)');
    await page.locator('[data-act="saveDraft"]').click();
    assert.match(await txt(page.locator('#e-name')), /Hãy đặt tên cho địa điểm/, 'không tên: không lưu, báo lỗi gần ô');
    assert.equal(await page.locator('#p-name').getAttribute('aria-invalid'), 'true', 'ô tên đánh dấu không hợp lệ');
    await page.locator('#p-name').fill('Thác Chiêng Khương');
    await page.locator('#p-lat').fill('abc');
    await page.locator('[data-act="saveDraft"]').click();
    assert.match(await txt(page.locator('#e-lat')), /Vĩ độ phải là một số/, 'vĩ độ sai: báo lỗi trường');
    await page.locator('#p-lat').fill('');
    await page.locator('[data-act="saveDraft"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Đã lưu bản nháp/, 'lưu nháp được dù thiếu nhiều thứ');
    const bl = await txt(page.locator('.rules'));
    assert.match(bl, /Có ít nhất 1 ảnh/, 'bảng kiểm nêu ảnh');
    assert.match(bl, /Câu giới thiệu dài 20–140 ký tự/, 'bảng kiểm nêu câu giới thiệu');
    assert.equal(await page.locator('[data-act="publishPlace"]').getAttribute('aria-disabled'), 'true', 'nút Xuất bản báo bị vô hiệu cho trình đọc màn hình');
    assert.match(await txt(page.locator('#pubwhy')), /Chưa xuất bản được: còn 9 lỗi chặn/, 'nói rõ còn bao nhiêu lỗi chặn');
    assert.equal(await page.locator('#e-name').count(), 0, 'đã nhập tên thì không còn lỗi tên (lỗi chỉ hiện sau khi bấm Lưu)');
    await page.locator('[data-act="publishPlace"]').click({ force: true });   // aria-disabled: người dùng vẫn bấm được và phải nhận phản hồi
    assert.equal(await page.locator('#sheet:not([hidden])').count(), 0, 'bấm Xuất bản khi còn lỗi: KHÔNG mở hộp xác nhận');
    assert.match(await page.locator('#toast').textContent(), /Chưa xuất bản được/, 'bấm vẫn có phản hồi bằng chữ');

    // ---- F. Điền đủ → hết lỗi chặn → xuất bản có xác nhận (nói rõ nội dung chưa kiểm chứng) ----
    await page.locator('#p-cat').selectOption('canh');
    await page.locator('#p-area').fill('Xín Mần');
    await page.locator('#p-hook').fill('Thác nước chảy giữa rừng, hợp ghé buổi sáng.');
    await page.locator('#p-lat').fill('22,6');
    await page.locator('#p-lon').fill('104.5');
    await page.locator('[data-month="9"]').click();
    await page.locator('[data-month="10"]').click();
    assert.match(await txt(page.locator('#l-months')), /Tháng 9–10/, 'nhãn tháng gộp khoảng liên tiếp');
    await page.locator('#p-tips').fill('Mang giày chống trơn.');
    await page.locator('#p-verdict').selectOption('worth');
    await page.locator('#p-why').fill('Đẹp nhưng xa trục chính.');
    await page.locator('[data-act="addPhoto"]').click();
    await page.locator('#ph-a0').fill('Nguyễn Văn A');
    await page.locator('#ph-l0').fill('CC BY 4.0');
    await page.locator('#ph-s0').fill('https://commons.wikimedia.org/wiki/File:Mau.jpg');
    await page.waitForFunction(() => /Xuất bản làm thay đổi hiện ra với mọi người dùng ngay/.test((document.getElementById('pubwhy') || {}).textContent || ''), null, { timeout: 3000 });   // bảng kiểm cập nhật khi đang gõ, không đợi bấm Lưu
    assert.equal(await page.locator('[data-act="publishPlace"]').getAttribute('aria-disabled'), null, 'đủ chuẩn: nút Xuất bản hết vô hiệu');
    await page.locator('[data-act="publishPlace"]').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await txt(page.locator('#panel')), /nội dung biên tập CHƯA được người kiểm chứng/, 'xác nhận nhắc nội dung chưa kiểm chứng');
    await page.locator('[data-act="doPublish"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.equal(await page.locator('.arow:has(.thumb)').count(), 10, 'danh sách có 10 địa điểm');
    assert.match(await txt(page.locator('.arow', { hasText: 'Thác Chiêng Khương' })), /Đã xuất bản/, 'địa điểm mới đã xuất bản');

    // ---- G. Sửa địa điểm đang xuất bản: lưu nháp tạo "Có thay đổi chưa xuất bản"; bỏ thay đổi trả về như cũ ----
    await page.locator('[data-edit="cot-co-lung-cu"]').click();
    await page.locator('#p-hook').fill('Ngắn quá.');
    await page.locator('[data-act="saveDraft"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await txt(page.locator('.ahead')), /Có thay đổi chưa xuất bản/, 'trạng thái sau khi lưu nháp');
    assert.match(await txt(page.locator('#pubwhy')), /còn 1 lỗi chặn/, 'câu quá ngắn: 1 lỗi chặn');
    // rời khỏi form khi còn thay đổi chưa lưu → hộp hỏi
    await page.locator('#p-hook').fill('Ngắn quá, chưa lưu.');
    await page.locator('.crumbs [data-go="dest"]').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await txt(page.locator('#panel')), /Bạn có thay đổi chưa lưu/, 'hỏi trước khi bỏ thay đổi');
    await page.locator('[data-act="closeSheet"]').click();
    assert.equal(await page.locator('#p-hook').inputValue(), 'Ngắn quá, chưa lưu.', 'Ở lại: không mất chữ đang gõ');
    // hết phiên khi đang sửa dở: bản nháp được giữ tạm
    await page.locator('[data-act="expire"]').click();
    await page.locator('.alogin [role="alert"]').waitFor();
    assert.match(await txt(page.locator('.alogin [role="alert"]')), /Phiên quản trị đã hết.*Bản nháp bạn đang sửa đã được giữ tạm/, 'hết phiên: nói rõ không mất chữ');
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H1', 'focus về tiêu đề để người dùng biết đã bị đưa ra');
    await enter();
    await openDest();
    await page.locator('[data-edit="cot-co-lung-cu"]').click();
    assert.equal(await page.locator('#p-hook').inputValue(), 'Ngắn quá, chưa lưu.', 'đăng nhập lại: chữ đang gõ vẫn còn');
    await page.locator('[data-act="discardDraft"]').click();
    await page.locator('[data-act="doDiscard"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.match(await txt(page.locator('.arow', { hasText: 'Cột cờ Lũng Cú' })), /Đã xuất bản/, 'bỏ thay đổi: về trạng thái Đã xuất bản');

    // ---- H. Gỡ xuất bản địa điểm và xóa bản nháp địa điểm mới ----
    await page.locator('[data-edit]').last().click();
    await page.locator('[data-act="unpublishPlace"]').click();
    await page.locator('[data-act="doUnpublish"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.match(await txt(page.locator('.arow', { hasText: 'Thác Chiêng Khương' })), /Bản nháp/, 'gỡ xuất bản: thành bản nháp');
    await page.locator('[data-edit]').last().click();
    await page.locator('[data-act="discardDraft"]').click();
    assert.match(await txt(page.locator('#panel')), /Địa điểm vẫn là bản nháp/, 'địa điểm từng xuất bản rồi gỡ: bỏ thay đổi KHÔNG xóa hẳn, nói rõ');
    await page.locator('[data-act="doDiscard"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.equal(await page.locator('.arow:has(.thumb)').count(), 10, 'vẫn còn 10 địa điểm (một bản nháp)');
    // bản nháp CHƯA TỪNG xuất bản thì xóa hẳn, có nói rõ
    await page.locator('[data-act="newPlace"]').click();
    await page.locator('#p-name').fill('Thử xóa');
    await page.locator('[data-act="saveDraft"]').click();
    await page.locator('#toast').waitFor();
    await page.locator('[data-act="discardDraft"]').click();
    assert.match(await txt(page.locator('#panel')), /Địa điểm mới sẽ bị xóa hẳn/, 'xóa nháp mới: nói rõ xóa hẳn');
    await page.locator('[data-act="doDiscard"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.equal(await page.locator('.arow:has(.thumb)').count(), 10, 'xóa bản nháp mới: về lại 10');
    // mở form mới rồi thoát khi chưa gõ gì: không để lại bản ghi trống
    await page.locator('[data-act="newPlace"]').click();
    await page.locator('#p-name').waitFor();
    await page.locator('.crumbs [data-go="dest"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    assert.equal(await page.locator('.arow:has(.thumb)').count(), 10, 'thoát form trống: không còn bản ghi "(chưa đặt tên)"');
    assert.equal((await txt(page.locator('.alist'))).includes('(chưa đặt tên)'), false, 'không có dòng chưa đặt tên');

    // ---- I. Gỡ xuất bản cả điểm đến có xác nhận, nói rõ chuyến đi của người dùng không mất ----
    await page.locator('[data-act="togglePub"]').click();
    assert.match(await txt(page.locator('#panel')), /Chuyến đi đã lưu của họ vẫn giữ nguyên/, 'gỡ điểm đến: nói rõ không ảnh hưởng chuyến đã lưu');
    await page.locator('[data-act="doTogglePub"]').click();
    assert.match(await txt(page.locator('.ahead')), /Đã gỡ/, 'điểm đến đã gỡ');
    await page.locator('[data-act="togglePub"]').click();   // còn bản nháp "Thác Chiêng Khương" (đã gỡ) và các địa điểm khác
    const gate = await page.locator('#toast').textContent();
    const stillBlocked = /Chưa xuất bản được điểm đến/.test(gate);
    if (stillBlocked) assert.equal(await page.locator('#tab-quality').getAttribute('aria-selected'), 'true', 'bị chặn: đưa người dùng sang tab Chất lượng');
    else await page.locator('[data-act="doTogglePub"]').click();

    // ---- I2. Ca biên của form: điểm nổi bật quá 4, URL nguồn không phải http(s), câu giới thiệu có khoảng trắng thừa ----
    await page.locator('#tab-places').click();
    await page.locator('[data-edit="cot-co-lung-cu"]').click();
    await page.locator('#p-hl').fill('1\n2\n3\n4\n5');
    await page.locator('[data-act="saveDraft"]').click();
    assert.match(await txt(page.locator('#e-hl')), /Tối đa 4 điểm nổi bật \(đang 5\)/, 'dòng thứ 5 không bị cắt âm thầm: báo lỗi');
    await page.locator('#p-hl').fill('1\n2');
    const src = page.locator('#ph-s0');
    await src.fill('javascript:alert(1)');
    await page.waitForFunction(() => /còn 1 lỗi chặn/.test((document.getElementById('pubwhy') || {}).textContent || ''), null, { timeout: 3000 });
    assert.match(await txt(page.locator('.rules')), /đường dẫn nguồn \(http hoặc https\)/, 'URL javascript: bị chặn xuất bản');
    await src.fill('https://commons.wikimedia.org/wiki/File:Cot_co.jpg');
    const hook140 = 'a'.repeat(140);
    await page.locator('#p-hook').fill(hook140 + '   ');
    await page.locator('[data-act="saveDraft"]').click();
    await page.locator('#toast').waitFor();
    assert.equal(await page.locator('#e-hook').count(), 0, 'hook đúng 140 ký tự + khoảng trắng thừa: bảng kiểm và nút Lưu cùng nhất quán (không báo 141)');
    // tọa độ: chỉ số thập phân
    await page.locator('#p-lat').fill('0x10');
    await page.locator('[data-act="saveDraft"]').click();
    assert.match(await txt(page.locator('#e-lat')), /Vĩ độ phải là một số/, '0x10 không được nhận làm tọa độ');
    await page.locator('#p-lat').fill('23,36');
    await page.locator('[data-act="discardDraft"]').click();
    await page.locator('[data-act="doDiscard"]').click();
    await page.locator('.arow:has(.thumb)').first().waitFor();
    // đăng xuất khi form đang dở: phải hỏi, không mất chữ âm thầm
    await page.locator('[data-edit="cot-co-lung-cu"]').click();
    await page.locator('#p-area').fill('Khu vực mới chưa lưu');
    await page.locator('[data-act="logout"]').click();
    await page.getByRole('dialog').waitFor();
    assert.match(await txt(page.locator('#panel')), /Bạn có thay đổi chưa lưu/, 'đăng xuất khi form dở: hỏi trước');
    await page.locator('[data-act="closeSheet"]').click();
    assert.equal(await page.locator('#p-area').inputValue(), 'Khu vực mới chưa lưu', 'Ở lại: còn nguyên chữ');
    await page.locator('[data-act="logout"]').click();
    await page.locator('[data-act="leaveDrop"]').click();
    await page.locator('.alogin').waitFor();
    // tab lạ trong localStorage không phá trang
    await page.evaluate(() => { const k = 'wander-admin-proto'; const o = JSON.parse(localStorage.getItem(k)); o.s.tab = '"><img src=x onerror=alert(1)>'; localStorage.setItem(k, JSON.stringify(o)); });
    await page.reload();
    await page.locator('.alogin').waitFor();
    await enter();
    await openDest();
    assert.equal(await page.locator('#tab-places').getAttribute('aria-selected'), 'true', 'giá trị tab lạ bị bỏ, về tab Địa điểm');

    // ---- J. Điện thoại 390: không tràn ngang ở danh sách, biểu mẫu, kiểm tra ----
    const ph = await newPage({ size: 390 });
    await fresh(ph);
    await enter(ph);
    const ox = () => ph.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert.equal(await ox(), true, '390: danh sách điểm đến không cuộn ngang');
    await openDest(ph);
    assert.equal(await ox(), true, '390: danh sách địa điểm không cuộn ngang');
    await ph.locator('[data-edit="cot-co-lung-cu"]').click();
    await ph.locator('#p-name').waitFor();
    assert.equal(await ox(), true, '390: biểu mẫu không cuộn ngang');
    await ph.locator('.crumbs [data-go="dest"]').click();
    await ph.locator('#tab-quality').click();
    assert.equal(await ox(), true, '390: tab kiểm tra không cuộn ngang');
    await ph.close();
  },
};
