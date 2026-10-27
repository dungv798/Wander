// F20 (DG-2 A4/A5): quản trị, KHUNG: tạo điểm đến mới ở dạng bản nháp (không xuất bản được) và chọn tệp ảnh có kiểm kiểu/dung lượng.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export default {
  id: 'F20',
  title: 'quản trị: tạo bản nháp điểm đến (khóa xuất bản), chọn tệp ảnh kiểm kiểu và 5 MB, ghi công vẫn bắt buộc',
  size: 1280,
  async run({ page, url, assert }) {
    const txt = async (loc) => (await loc.textContent()).replace(/[ \t\r\n]+/g, ' ').trim();
    await page.goto(url + '/admin.html'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/admin.html');
    await page.locator('[data-act="enter"]').click(); await page.locator('.alist').waitFor();

    // ---- A. Tạo bản nháp điểm đến: có sẵn trong danh sách "sắp ra mắt" hoặc gõ tên mới ----
    await page.locator('[data-act="newDest"]').first().click();
    assert.match(await txt(page.locator('#toast')), /Đã tạo bản nháp/, 'báo đã tạo bản nháp');
    assert.equal(await page.locator('.arow .badge.draft', { hasText: 'Bản nháp' }).count(), 1, 'hàng bản nháp');
    assert.equal(await page.locator('.arow:has(.badge.draft) button[disabled]', { hasText: 'Xuất bản' }).count(), 1, 'Xuất bản bị khóa vì chưa có địa điểm');
    assert.match(await txt(page.locator('#nd-why')), /BẢN THỬ \(khung\)/, 'nói rõ khung');
    await page.locator('#nd-name').fill('');
    await page.locator('.ndform button').click();
    assert.match(await txt(page.locator('#nd-err')), /nhập tên điểm đến/, 'tên rỗng bị chặn');
    await page.locator('#nd-name').fill('hà giang');
    await page.locator('.ndform button').click();
    assert.match(await txt(page.locator('#nd-err')), /đã có/, 'trùng điểm đến đang có (không phân biệt hoa thường)');
    await page.locator('#nd-name').fill('ha GIANG');
    await page.locator('.ndform button').click();
    assert.match(await txt(page.locator('#nd-err')), /đã có/, 'trùng điểm đến đang có kể cả khi không dấu');
    await page.locator('#nd-name').fill('Mộc Châu');
    await page.locator('.ndform button').click();
    assert.equal(await page.locator('.arow', { hasText: 'Mộc Châu' }).count(), 1, 'tên mới thành bản nháp');
    await page.reload(); await page.locator('.alist').waitFor();
    assert.equal(await page.locator('.arow', { hasText: 'Mộc Châu' }).count(), 1, 'bản nháp còn sau khi tải lại (lưu ở máy)');
    await page.locator('[data-act="dropDest"][data-what="Mộc Châu"]').click();
    assert.equal(await page.locator('.arow', { hasText: 'Mộc Châu' }).count(), 0, 'bỏ bản nháp');

    // ---- B. Chọn tệp ảnh: kiểu và dung lượng kiểm ngay; hợp lệ vẫn "chưa tải lên máy chủ" ----
    await page.locator('[data-open-dest]').click(); await page.locator('[role="tablist"]').waitFor();
    await page.locator('.arow:has(.thumb) [data-open-place], .arow:has(.thumb) button').first().click();
    await page.locator('#pf').waitFor();
    await page.locator('[data-act="addPhoto"]').click();
    const idx = (await page.locator('fieldset.photo').count()) - 1;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wander-up-'));
    const bad = path.join(dir, 'tai-lieu.pdf'); fs.writeFileSync(bad, '%PDF-1.4');
    const big = path.join(dir, 'anh-to.png'); fs.writeFileSync(big, Buffer.alloc(5 * 1024 * 1024 + 10));
    const ok = path.join(dir, 'anh-nho.jpg'); fs.writeFileSync(ok, Buffer.alloc(2048));
    const input = page.locator('#ph-f' + idx);
    await input.setInputFiles(bad);
    assert.match(await txt(page.locator('#ph-fe' + idx)), /Chỉ nhận JPG, PNG hoặc WebP/, 'sai kiểu tệp bị chặn');
    await input.setInputFiles(big);
    assert.match(await txt(page.locator('#ph-fe' + idx)), /Tối đa 5 MB/, 'quá 5 MB bị chặn');
    await page.locator('#ph-f' + idx).setInputFiles(ok);
    await page.locator('#ph-n' + idx).waitFor();
    assert.match(await txt(page.locator('#ph-n' + idx)), /Đã chọn: anh-nho\.jpg/, 'tệp hợp lệ được ghi nhận');
    assert.match(await txt(page.locator('#ph-n' + idx)), /gỡ thông tin vị trí \(EXIF\)/, 'nói rõ bỏ EXIF');
    assert.match(await txt(page.locator('#ph-n' + idx)), /chưa tải lên máy chủ/, 'nói thật là chưa tải lên');
    await page.waitForTimeout(400);   // bảng kiểm bên phải cập nhật sau một nhịp (debounce)
    const all = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    assert.match(all, /Chưa xuất bản được: còn \d+ lỗi chặn/, 'ảnh thiếu ghi công vẫn chặn xuất bản');
    fs.rmSync(dir, { recursive: true, force: true });
  },
};
