// F22: nút đổi giao diện ở Cài đặt (PO 25/10/2026): MẶC ĐỊNH SÁNG kể cả khi hệ thống ở chế độ tối; chọn Tối / Theo hệ thống; nhớ lựa chọn; quản trị theo cùng lựa chọn.
const KEY = 'wander-kham-pha-proto-v8';
export default {
  id: 'F22',
  title: 'giao diện: mặc định sáng dù hệ thống tối, đổi Sáng/Tối/Theo hệ thống ở Cài đặt, nhớ lựa chọn, quản trị theo',
  size: 390,
  async run({ page, url, assert }) {
    const theme = () => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const openSettings = async () => { await page.locator('.tab[data-go="trips"]').click(); await page.locator('[data-go="settings"]').click(); await page.locator('h1', { hasText: 'Cài đặt và giới thiệu' }).waitFor(); };

    // ---- A. Hệ thống ở chế độ TỐI nhưng chưa chọn gì: vẫn SÁNG ----
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(url + '/'); await page.evaluate(() => localStorage.clear()); await page.goto(url + '/');
    await page.locator('.sky, .hero-w').first().waitFor();
    assert.equal(await theme(), 'light', 'mặc định ép sáng');
    assert.notEqual(await bg(), 'rgb(21, 34, 61)', 'nền không phải nền tối dù hệ thống tối: ' + await bg());

    // ---- B. Cài đặt có nhóm "Giao diện", Sáng đang chọn ----
    await openSettings();
    const group = page.locator('[role="group"][aria-label="Giao diện"]');
    assert.equal(await group.locator('[data-act="theme:light"]').getAttribute('aria-pressed'), 'true', 'Sáng đang chọn');
    assert.equal(await group.locator('[data-act="theme:dark"]').getAttribute('aria-pressed'), 'false', 'Tối chưa chọn');
    assert.equal(await group.locator('button').count(), 3, 'ba lựa chọn: Sáng, Tối, Theo hệ thống');

    // ---- C. Chọn Tối: đổi ngay, nhớ sau khi tải lại ----
    await group.locator('[data-act="theme:dark"]').click();
    assert.equal(await theme(), 'dark', 'Tối: data-theme=dark');
    assert.equal(await bg(), 'rgb(21, 34, 61)', 'nền tối theo bộ màu mới: ' + await bg());
    assert.equal(await page.locator('[data-act="theme:dark"]').getAttribute('aria-pressed'), 'true', 'nút Tối được đánh dấu');
    await page.reload();
    await page.locator('#screen > *').first().waitFor();
    assert.equal(await theme(), 'dark', 'nhớ lựa chọn sau khi tải lại');

    // ---- D. Quản trị theo cùng lựa chọn ----
    await page.goto(url + '/admin.html');
    await page.locator('.alogin').waitFor();
    assert.equal(await theme(), 'dark', 'trang quản trị theo lựa chọn của app');

    // ---- E. Theo hệ thống: bỏ ép; theo chế độ hệ thống đang mô phỏng (tối) rồi đổi sang sáng ----
    await page.goto(url + '/');
    await openSettings();
    await page.locator('[data-act="theme:system"]').click();
    assert.equal(await theme(), null, 'Theo hệ thống: không còn data-theme');
    assert.equal(await bg(), 'rgb(21, 34, 61)', 'hệ thống tối thì nền tối');
    await page.emulateMedia({ colorScheme: 'light' });
    assert.notEqual(await bg(), 'rgb(21, 34, 61)', 'hệ thống sáng thì nền sáng: ' + await bg());

    // ---- F. Quay về Sáng ----
    await page.locator('[data-act="theme:light"]').click();
    assert.equal(await theme(), 'light', 'về Sáng');
    await page.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await theme(), 'light', 'Sáng bất chấp hệ thống tối');
  },
};
