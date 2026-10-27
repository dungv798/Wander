// F08 (T9): Bảo mật (mã khôi phục, thiết bị tin cậy, mã ghép), tạo lại mã cần xác thực lại, khôi phục trên máy mới (KP-C, MĐ-3, QĐ-3, QĐ-6).
const KEY = 'wander-kham-pha-proto-v8', SKEY = 'wander-proto-server';
const DEMO = '7K2QF-R9XMT-4B8HD-WJ3NC-5VZ6A-E1G0Y';
export default {
  id: 'F08',
  title: 'Bảo mật, thu hồi, mã ghép, tạo lại mã, khôi phục bằng mã và bằng thiết bị cũ',
  size: 390,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    const st = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    const srv = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), SKEY);
    const demo = async () => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/'); await page.locator('.sky, .hero-w').first().waitFor(); await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-go="security"]').click(); await page.locator('.seccard').first().waitFor(); };
    const fresh = async (q = '') => { await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/?fresh=1&intro=0' + q); await page.locator('.sky, .hero-w').first().waitFor(); await page.locator('[data-go="recover"]').click(); await page.locator('h1', { hasText: 'Mở chuyến đi trên máy này' }).waitFor(); };

    // ---- A. Trang Bảo mật: không lộ mã; thiết bị; thu hồi ----
    await demo();
    assert.equal((await txt(page.locator('body'))).includes(DEMO), false, 'trang Bảo mật KHÔNG hiện mã khôi phục (Wander không giữ bản đọc được)');
    assert.match(await txt(page.locator('.seccard').first()), /Bạn đã có mã khôi phục/, 'trạng thái mã');
    assert.equal(await page.locator('.devrow').count(), 2, 'có 2 thiết bị tin cậy');
    assert.match(await txt(page.locator('.devrow').first()), /Thiết bị này.*Đang dùng/, 'đánh dấu thiết bị hiện tại');
    assert.equal(await page.locator('.devrow').first().locator('[data-act^="revoke:"]').count(), 0, 'không thu hồi được chính thiết bị đang dùng');
    await page.locator('.devrow', { hasText: 'Máy tính bảng' }).locator('[data-act^="revoke:"]').click();
    assert.match(await txt(page.locator('#panel')), /không cần xác thực lại và không hoàn tác được/, 'nói rõ thu hồi không cần xác thực lại (5.5) và không hoàn tác');
    await page.locator('#panel [data-act="closeSheet"]').click();
    assert.equal(await page.locator('.devrow').count(), 2, 'hủy: không thu hồi');
    await page.locator('.devrow', { hasText: 'Máy tính bảng' }).locator('[data-act^="revoke:"]').click();
    await page.locator('#panel [data-act^="revokeYes:"]').click();
    assert.equal(await page.locator('.devrow').count(), 1, 'đã thu hồi');

    // ---- B. Mã ghép XXXX-XXXX: sai / hết hạn / dùng lại cùng một thông báo; đúng thì hiện màn duyệt đủ thông tin, duyệt mới thêm thiết bị ----
    await demo();
    const generic = /Mã ghép chưa đúng hoặc đã hết hạn/;
    await page.locator('#p-code').fill('ABCD-EFGH');
    await page.locator('[data-act="pairApprove"]').click();
    assert.match(await txt(page.locator('#p-warn')), generic, 'chưa có yêu cầu ghép: báo chung');
    await page.locator('[data-act="protoPair"]').click();
    const shown = (await page.locator('.protobox .pcode').textContent()).trim();
    assert.match(shown, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/, 'mã ghép XXXX-XXXX');
    await page.locator('#p-code').fill(shown === 'ABCD-EFGH' ? 'JKMN-PQRS' : 'ABCD-EFGH');
    await page.locator('[data-act="pairApprove"]').click();
    assert.match(await txt(page.locator('#p-warn')), generic, 'mã ghép sai: cùng thông báo chung');
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.pairing.at = Date.now() - 6 * 60000; localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload(); await page.locator('.seccard').first().waitFor();
    await page.locator('#p-code').fill(shown);
    await page.locator('[data-act="pairApprove"]').click();
    assert.match(await txt(page.locator('#p-warn')), generic, 'mã ghép hết hạn (6 phút): cùng thông báo chung');
    await page.locator('[data-act="protoPair"]').click();
    const code2 = (await page.locator('.protobox .pcode').textContent()).trim();
    await page.locator('#p-code').fill(code2.toLowerCase().replace('-', ' '));
    await page.locator('[data-act="pairApprove"]').click();
    await page.locator('#panel').getByText('Duyệt thiết bị mới?').waitFor();
    const confirmTxt = await txt(page.locator('#panel'));
    assert.match(confirmTxt, /Máy tính mới/, 'màn duyệt nêu tên thiết bị');
    assert.match(confirmTxt, /Xin ghép (vừa xong|\d+ phút trước)/, 'màn duyệt nêu thời điểm');
    assert.match(confirmTxt, /Khu vực ước tính: Hà Nội \(đoán theo mạng, có thể sai\)\. Ví dụ của bản thử/, 'màn duyệt nêu khu vực ước tính, nói rõ có thể sai và đây là ví dụ của bản thử');
    assert.match(confirmTxt, /Chỉ duyệt nếu chính bạn vừa mở Wander/, 'cảnh báo chống lừa đảo');
    assert.equal(await page.locator('.devrow').count(), 2 + 1, 'màn duyệt đang mở: chưa thêm thiết bị (2 trên trang + 1 trong màn duyệt)');
    await page.locator('[data-act="pairYes"]').click();
    await page.locator('#toast').waitFor();
    assert.equal(await page.locator('.seccard .devrow').count(), 3, 'duyệt: thêm thiết bị');
    assert.equal((await srv()).code, DEMO, 'duyệt thiết bị KHÔNG tiêu thụ mã khôi phục (MĐ-3)');
    assert.match(await txt(page.locator('.evlist')), /Đã thêm «Máy tính mới» bằng mã ghép/, 'ghi nhật ký hoạt động');
    await page.locator('#p-code').fill(code2);
    await page.locator('[data-act="pairApprove"]').click();
    assert.match(await txt(page.locator('#p-warn')), generic, 'mã ghép đã dùng: không dùng lại được');
    // "Không phải tôi": từ chối, không thêm thiết bị
    await page.locator('[data-act="protoPair"]').click();
    const code3 = (await page.locator('.protobox .pcode').textContent()).trim();
    await page.locator('#p-code').fill(code3);
    await page.locator('[data-act="pairApprove"]').click();
    await page.locator('[data-act="pairNo"]').click();
    assert.equal(await page.locator('.seccard .devrow').count(), 3, 'từ chối: không thêm thiết bị');
    assert.match(await txt(page.locator('.evlist')), /Đã từ chối một yêu cầu ghép/, 'từ chối cũng ghi nhật ký');
    // giới hạn thử: khóa theo thiết bị này sau 5 lần sai
    for (let i = 0; i < 5; i++) { await page.locator('#p-code').fill('ZZZZ-ZZZZ'); await page.locator('[data-act="pairApprove"]').click(); }
    assert.match(await txt(page.locator('#p-warn')), /thử quá nhiều lần ở thiết bị này/, 'mã ghép: khóa sau 5 lần sai');
    // hoạt động từ thiết bị khác: chấm và banner cho người dùng
    await demo();
    await page.locator('[data-act="protoRemote"]').click();
    assert.match(await txt(page.locator('.infobox')), /Có hoạt động mới/, 'đang ở Bảo mật: banner hiện ngay');
    await page.evaluate((k) => { const x = JSON.parse(localStorage.getItem(k)); x.identity.unseen = true; x.view = 'trips'; localStorage.setItem(k, JSON.stringify(x)); }, KEY);   // thiết bị khác sinh hoạt động khi người dùng đang ở trang khác
    await page.reload(); await page.locator('.tcard').first().waitFor();
    await page.locator('.tab[data-go="picked"]').click();   // chuyển sang tab khác KHÔNG làm mất cờ "hoạt động mới" (chưa xem)
    await page.locator('.tab[data-go="trips"]').click();
    assert.equal(await page.locator('.udot').count(), 1, 'có chấm báo hoạt động mới ở nút Bảo mật');
    assert.match(await page.locator('[data-go="security"]').getAttribute('aria-label'), /có hoạt động mới/, 'nút Bảo mật nói rõ có hoạt động mới (không chỉ chấm màu)');
    await page.locator('[data-go="security"]').click();
    assert.match(await txt(page.locator('.infobox')), /Có hoạt động mới trên danh tính của bạn/, 'banner hoạt động mới');
    assert.match(await txt(page.locator('.evlist')), /thiết bị khác vừa khôi phục chuyến đi bằng mã/, 'nhật ký ghi hoạt động');

    // ---- C. Tạo mã mới cần xác thực lại: bằng thiết bị → phát hành + xác nhận; bằng mã → CHỈ MỘT lần phát hành ----
    await demo();
    await page.locator('[data-act="regenCode"]').click();
    await page.locator('#panel').getByText('Tạo mã khôi phục mới').first().waitFor();
    await page.locator('[data-act="reauthSend"]').click();
    await page.locator('[data-act="reauthApprove"]').click();
    await page.locator('#newcode').waitFor();
    const regen1 = (await page.locator('#newcode').textContent()).trim();
    assert.equal((await st()).identity.code, DEMO, 'chưa xác nhận: mã cũ vẫn hiệu lực');
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill(regen1);
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('#toast').waitFor();
    assert.equal((await st()).identity.code, regen1, 'xác nhận xong: mã mới có hiệu lực');
    assert.equal((await srv()).code, regen1, '"máy chủ" cũng đổi sang mã mới');
    // xác thực lại bằng mã: trình mã cũ và xác nhận mã mới là MỘT lần commit
    await page.locator('[data-act="regenCode"]').click();
    await page.locator('[data-act="reauthMode:code"]').click();
    await page.locator('#r-code').fill(regen1);
    await page.locator('[data-act="reauthCode"]').click();
    await page.locator('#newcode').waitFor();
    const regen2 = (await page.locator('#newcode').textContent()).trim();
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill(regen2);
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('#newcode').count(), 0, 'dùng mã làm bằng chứng: KHÔNG hiện mã mới lần thứ hai');
    assert.equal((await st()).identity.code, regen2, 'mã đổi đúng một lần');
    assert.notEqual(regen2, regen1, 'mã mới khác mã cũ');

    // ---- C2. Xác thực lại bằng mã: sai, nhập lại sai, hủy giữa chừng, khóa sau 5 lần, chặn khi không có bằng chứng (chuyển từ F07 sau DR-011 B1) ----
    await demo();
    await page.locator('[data-act="regenCode"]').click();
    await page.locator('[data-act="reauthMode:code"]').click();
    await page.locator('#r-code').fill('SAI-SAI-SAI');
    await page.locator('[data-act="reauthCode"]').click();
    assert.equal(await txt(page.locator('#r-warn')), 'Mã chưa đúng hoặc không còn hiệu lực.', 'mã sai: thông báo chung, KHÔNG đếm lần còn lại (MĐ-8)');
    await page.locator('#r-code').fill('7k2qf r9xmt 4b8hd wj3nc 5vz6a e1g0y');   // chữ thường, khoảng trắng: vẫn nhận (chuẩn hóa)
    await page.locator('[data-act="reauthCode"]').click();
    await page.locator('#newcode').waitFor();
    const c2New = (await page.locator('#newcode').textContent()).trim();
    assert.match(c2New, /^([0-9A-HJKMNP-TV-Z]{5}-){5}[0-9A-HJKMNP-TV-Z]{5}$/, 'mã mới đúng định dạng backend: ' + c2New);
    assert.equal((await st()).identity.code, DEMO, 'CHƯA xác nhận: mã cũ vẫn hiệu lực (QĐ-6)');
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill('AAAA-BBBB-CCCC');
    await page.locator('[data-act="codeConfirm"]').click();
    assert.match(await txt(page.locator('#c-warn')), /chưa khớp/, 'nhập lại sai mã mới: không hoàn tất');
    assert.equal((await st()).identity.code, DEMO, 'nhập lại sai: mã cũ vẫn hiệu lực');
    await page.locator('#c-re').fill(c2New.toLowerCase());
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('#toast').waitFor();
    assert.equal((await st()).identity.code, c2New, 'xác nhận xong: mã mới có hiệu lực');
    // mã cũ hết hiệu lực; khóa tạm sau 5 lần sai
    await page.locator('[data-act="regenCode"]').click();
    await page.locator('[data-act="reauthMode:code"]').click();
    await page.locator('#r-code').fill(DEMO);
    await page.locator('[data-act="reauthCode"]').click();
    assert.match(await txt(page.locator('#r-warn')), /chưa đúng hoặc không còn hiệu lực/, 'mã cũ đã hết hiệu lực');
    for (let i = 0; i < 4; i++) { await page.locator('#r-code').fill('XXXX-XXXX-XXXX'); await page.locator('[data-act="reauthCode"]').click(); }
    assert.match(await txt(page.locator('#panel')), /thử quá nhiều lần/, 'khóa tạm sau 5 lần sai');
    assert.equal(await page.locator('#r-code').isDisabled(), true, 'ô nhập bị khóa');
    await page.locator('#panel [data-act="closeSheet"]').last().click();
    // hủy giữa chừng khi thay mã: không đổi gì
    await demo();
    await page.locator('[data-act="regenCode"]').click();
    await page.locator('[data-act="reauthMode:code"]').click();
    await page.locator('#r-code').fill(DEMO);
    await page.locator('[data-act="reauthCode"]').click();
    await page.locator('[data-act="codeCancel"]').click();
    assert.equal((await st()).identity.code, DEMO, 'hủy giữa chừng: mã giữ nguyên');
    // chưa có mã: trang Bảo mật chỉ đưa "Tạo mã khôi phục" (không có xác thực lại); bỏ qua thì cảnh báo mất quyền vĩnh viễn
    // (hộp "Chưa thể xác thực lại" cho trường hợp không có bằng chứng vẫn có trong ứng dụng cho thao tác cần xác thực lại cấp chuyến, chưa dựng ở bản thử)
    await page.evaluate((k) => { const s = JSON.parse(localStorage.getItem(k)); s.identity.code = null; s.identity.devices = s.identity.devices.filter((d) => d.current); localStorage.setItem(k, JSON.stringify(s)); }, KEY);
    await page.reload();
    await page.locator('.seccard').first().waitFor();
    assert.equal(await page.locator('[data-act="regenCode"]').count(), 0, 'chưa có mã: không có nút "Tạo mã mới" cần xác thực lại');
    await page.locator('[data-act="issueNow"]').click();
    await page.locator('#newcode').waitFor();
    assert.equal(await page.locator('[data-act="codeSkip"]').count(), 0, 'tạo mã từ Bảo mật: KHÔNG có "Để sau" (chỉ ở lần lưu chuyến đầu tiên)');
    await page.locator('[data-act="codeCancel"]').click();
    await page.locator('#sheet').waitFor({ state: 'hidden' });
    assert.equal((await st()).identity.code, null, 'hủy: danh tính vẫn chưa có mã');
    await page.locator('[data-act="issueNow"]').click();
    await page.locator('#newcode').waitFor();
    await page.locator('[data-act="codeNext"]').click();
    assert.equal(await page.locator('#c-re').getAttribute('placeholder'), 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 'bước nhập lại mã');

    // ---- D. Khôi phục trên máy mới bằng mã (KP-C): mã sai, hủy giữa chừng, hết hạn, thành công ----
    await fresh();
    assert.match(await txt(page.locator('.protobox')), new RegExp(DEMO), 'bản thử có mã mẫu để thử');
    await page.locator('#rc-code').fill('SAI-SAI-SAI');
    await page.locator('[data-act="recCode"]').click();
    assert.equal(await txt(page.locator('#rc-warn')), 'Mã chưa đúng hoặc không còn hiệu lực.', 'mã sai: thông báo chung, KHÔNG đếm lần còn lại (MĐ-8)');
    await page.locator('#rc-code').fill(DEMO);
    await page.locator('[data-act="recCode"]').click();
    await page.locator('#newcode').waitFor();
    const recNew = (await page.locator('#newcode').textContent()).trim();
    assert.match(await txt(page.locator('#panel')), /Khôi phục chỉ hoàn tất khi bạn xác nhận mã mới/, 'nói rõ phải xác nhận mã mới (QĐ-6)');
    assert.equal(await page.locator('[data-act="codeSkip"]').count(), 0, 'khôi phục: KHÔNG được bỏ qua mã thay thế (QĐ-6)');
    await page.locator('[data-act="codeCancel"]').click();
    assert.equal((await srv()).code, DEMO, 'hủy giữa chừng: mã cũ vẫn hiệu lực');
    assert.equal(await page.evaluate((k) => localStorage.getItem(k), KEY) === null || (await st()).identity === null, true, 'hủy giữa chừng: máy này vẫn chưa có danh tính');
    // 5 lần sai thì khóa
    for (let i = 0; i < 3; i++) { await page.locator('#rc-code').fill('XXXX-XXXX-XXXX'); await page.locator('[data-act="recCode"]').click(); }
    await page.locator('#rc-code').fill('XXXX-XXXX-XXXX'); await page.locator('[data-act="recCode"]').click();
    assert.match(await txt(page.locator('#rc-warn')), /thử quá nhiều lần/, 'khóa tạm sau 5 lần sai');
    assert.equal(await page.locator('#rc-code').isDisabled(), true, 'ô nhập bị khóa');

    // ---- E. Lần thử khôi phục hết hạn: mã thay thế đã hiện không còn hiệu lực ----
    await fresh('&ttl=1');
    await page.locator('#rc-code').fill(DEMO);
    await page.locator('[data-act="recCode"]').click();
    await page.locator('#newcode').waitFor();
    await page.locator('[data-act="codeNext"]').click();
    const expiredCode = (await page.locator('#c-re').getAttribute('placeholder'));
    await page.waitForTimeout(1500);
    await page.locator('#c-re').fill('AAAA-BBBB-CCCC');
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#toast').waitFor();
    assert.match(await page.locator('#toast').textContent(), /Lần thử đã hết hạn/, 'quá hạn: báo rõ và phải bắt đầu lại');
    assert.equal((await srv()).code, DEMO, 'hết hạn: mã cũ không đổi');
    assert.equal(expiredCode, 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 'bước nhập lại có mặt');

    // ---- F. Khôi phục thành công bằng mã: phiên cũ KHÔNG bị thu hồi (QĐ-3), có banner, mã cũ thành "đã dùng" ----
    await fresh();
    await page.locator('#rc-code').fill(DEMO.toLowerCase());
    await page.locator('[data-act="recCode"]').click();
    await page.locator('#newcode').waitFor();
    const okCode = (await page.locator('#newcode').textContent()).trim();
    await page.locator('[data-act="codeNext"]').click();
    await page.locator('#c-re').fill(okCode);
    await page.locator('[data-act="codeConfirm"]').click();
    await page.locator('#savedcode').waitFor();
    await page.locator('[data-act="codeDone"]').click();
    await page.locator('h1', { hasText: 'Bảo mật' }).waitFor();
    assert.match(await txt(page.locator('.infobox')), /Các thiết bị cũ vẫn còn hiệu lực/, 'banner nhắc kiểm tra thiết bị cũ (QĐ-3)');
    assert.equal(await page.locator('.devrow').count(), 3, '2 thiết bị cũ còn nguyên + thiết bị này');
    assert.equal((await srv()).code, okCode, 'mã mới có hiệu lực');
    assert.notEqual(okCode, DEMO, 'mã cũ đã được dùng và thay');
    await page.locator('.tab[data-go="trips"]').click();
    assert.equal(await page.locator('[data-trip]').count(), 1, 'sau khôi phục thấy lại chuyến đi');
    // mã cũ giờ bị từ chối với cùng thông báo chung
    await page.evaluate(() => localStorage.removeItem('wander-kham-pha-proto-v8'));
    await page.goto(url + '/?fresh=1&intro=0'); await page.locator('[data-go="recover"]').click();
    await page.locator('#rc-code').fill(DEMO);
    await page.locator('[data-act="recCode"]').click();
    assert.match(await txt(page.locator('#rc-warn')), /Mã chưa đúng hoặc không còn hiệu lực/, 'mã cũ (đã dùng) bị từ chối với thông báo chung, không lộ lý do');

    // ---- G. Khôi phục bằng thiết bị cũ duyệt (MĐ-3): không tiêu thụ mã, không cần mã thay thế; mã ghép hết hạn thì xin lại ----
    await fresh();
    await page.locator('[data-act="recMode:device"]').click();
    await page.locator('[data-act="recPair"]').click();
    const pc = (await page.locator('.pairbox .pcode').textContent()).replace(/\s/g, '');
    assert.match(pc, /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/, 'máy mới hiện mã ghép XXXX-XXXX (Secrets.newShortCode)');
    await page.locator('[data-act="recExpire"]').click();
    assert.match(await txt(page.locator('.warnbox')), /Mã ghép đã hết hạn/, 'mã ghép hết hạn: báo và cho xin lại');
    await page.locator('[data-act="recPair"]').click();
    await page.locator('[data-act="recApprove"]').click();
    await page.locator('h1', { hasText: 'Bảo mật' }).waitFor();
    assert.equal((await srv()).code, DEMO, 'duyệt bằng thiết bị cũ: mã khôi phục KHÔNG bị tiêu thụ và không cần mã thay thế');
    assert.equal(await page.locator('.devrow').count(), 3, 'thêm thiết bị này, giữ 2 thiết bị cũ');
  },
};
