// seed.ts nói chuyện với backend thật và từ chối nạp khi thiếu WANDER_E2E_DB; nạp lười để các màn chỉ cần danh mục (không cần phiên) vẫn chụp được.
const seed = await import('../e2e/seed.ts').catch(() => null);
/** Gọi hàm dựng dữ liệu của e2e; báo rõ khi môi trường e2e chưa sẵn sàng. */
function needSeed(name) {
  return (...args) => {
    if (!seed) throw new Error(`Màn này cần ${name} của e2e (đặt WANDER_E2E_DB và chạy backend e2e bằng tools\\dev.ps1)`);
    return seed[name](...args);
  };
}
/** Dựng chuyến mẫu qua backend thật rồi đổi mọi địa chỉ `mau-ha-giang` (mã mẫu cũ) trong `page.goto` thành mã chuyến máy chủ cấp. */
async function seedTrips(page) {
  const seeded = await needSeed('seedTrips')(page);
  const goto = page.goto.bind(page);
  page.goto = (target, options) => goto(String(target).replaceAll('mau-ha-giang', seeded.tripId), options);
  return seeded;
}
const seedIdentity = needSeed('seedIdentity');

// Danh sách màn dùng chung cho chụp ảnh (shots.mjs) và quét truy cập (a11y.mjs): mỗi màn có các bước đưa trình duyệt tới trạng thái cần kiểm.
/** Danh sách màn: mỗi màn có các bước đưa trình duyệt tới trạng thái cần chụp. */
export const SCREENS = [
  { id: 'dest-food', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang/am`); await p.waitForSelector('[data-place-id="exp-bua-sang"]'); } },
  { id: 'destination-guide', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.locator('.dest-guide').click(); const dialog = p.getByRole('dialog'); await dialog.getByRole('button', { name: /^Ăn gì/ }).click(); } },
  { id: 'home', go: async (p, url) => p.goto(`${url}/#/`) },
  { id: 'home-scrolled', go: async (p, url) => { await p.goto(`${url}/#/`); await p.waitForSelector('.nh-grid .nh-card'); await p.evaluate(() => { document.getElementById('screen').scrollTop = 700; }); } },
  // Điểm đến đã chọn vẫn được nhớ, nhưng Khám phá luôn mở toàn cảnh Việt Nam theo flow B.
  { id: 'home-selected', go: async (p, url) => { await p.goto(`${url}/#/`); await p.evaluate(() => localStorage.setItem('wander.web.destination.v1', 'ha-giang')); await p.reload(); await p.waitForSelector('.national-home .home-hero-card'); await p.waitForTimeout(600); } },
  { id: 'home-peek', go: async (p, url) => { await p.goto(`${url}/#/`); await p.waitForSelector('.shell-map .tmroot[data-ready="1"]'); const toggle = p.locator('.sheet-toggle'); if (await toggle.isVisible()) await toggle.click(); await p.waitForTimeout(1500); } },
  // Bản đồ khung bền: đi qua nhiều màn thì vẫn đúng MỘT phần tử bản đồ (cùng một nút DOM), màn che chỉ ẩn nó.
  { id: 'shell-persist', go: async (p, url) => {
    await p.goto(`${url}/#/`);
    await p.waitForSelector('.shell-map .tmroot[data-ready="1"]');
    await p.evaluate(() => { window.__shellMapNode = document.querySelector('.shell-map .tmroot'); });
    const check = async (label, scene) => {
      const r = await p.evaluate(() => ({ same: window.__shellMapNode === document.querySelector('.shell-map .tmroot'), count: document.querySelectorAll('.shell-map').length, scene: document.querySelector('.shell-map')?.dataset.scene, gl: document.querySelectorAll('.shell-map canvas').length }));
      if (!r.same || r.count !== 1 || r.gl !== 1 || (scene && r.scene !== scene)) throw new Error(`bản đồ khung không bền ở ${label}: ${JSON.stringify(r)}`);
    };
    await check('khám phá', 'overview');
    await p.goto(`${url}/#/dest/ha-giang`); await p.waitForTimeout(800); await check('điểm đến', 'destination');
    await p.goto(`${url}/#/picked`); await p.waitForTimeout(800); await check('đã chọn');
    await p.goto(`${url}/#/trips`); await p.waitForTimeout(800); await check('chuyến đi');
    // Bản B: bản đồ tiếp tục hiển thị sau thẻ quẹt; cùng canvas với điểm đến.
    await p.goto(`${url}/#/deck/ha-giang`); await p.waitForTimeout(800);
    await check('quẹt trên bản đồ', 'destination');
    await p.goto(`${url}/#/`); await p.waitForSelector('.shell-map .tmroot[data-ready="1"]');
    const back = await p.evaluate(() => document.querySelectorAll('canvas.maplibregl-canvas').length);
    if (back !== 1) throw new Error(`quay lại khám phá có ${back} canvas bản đồ`);
  } },
  // Đổi cỡ giữa chừng (xoay máy / kéo cửa sổ qua điểm ngắt 768): vẫn một bản đồ, bố cục chuyển giữa tờ đáy và bảng trái, không tràn ngang.
  { id: 'breakpoint-switch', go: async (p, url) => {
    await p.setViewportSize({ width: 390, height: 844 });
    await p.goto(`${url}/#/dest/ha-giang`);
    await p.waitForSelector('.shell-map .tmroot[data-ready="1"]');
    await p.evaluate(() => { window.__shellMapNode = document.querySelector('.shell-map .tmroot'); });
    for (const [w, h] of [[1440, 1000], [768, 1000], [390, 844]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(900);
      const r = await p.evaluate(() => ({ same: window.__shellMapNode === document.querySelector('.shell-map .tmroot'), overflow: document.documentElement.scrollWidth > window.innerWidth + 1, screenLeft: Math.round(document.getElementById('screen').getBoundingClientRect().left), screenW: Math.round(document.getElementById('screen').getBoundingClientRect().width) }));
      if (!r.same || r.overflow) throw new Error(`đổi cỡ ${w}x${h} làm hỏng khung: ${JSON.stringify(r)}`);
    }
  } },
  { id: 'home-search', go: async (p, url) => { await p.goto(`${url}/#/`); await p.locator('.map-chrome .search').click(); await p.waitForSelector('input[type=search]'); await p.fill('input[type=search]', 'ha gi'); } },
  { id: 'dest', go: async (p, url) => p.goto(`${url}/#/dest/ha-giang`) },
  { id: 'dest-guide', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.guide'); await p.evaluate(() => { document.getElementById('screen').scrollTop = 900; }); } },
  // Bản đồ chính của khung (không còn bản đồ nhúng): ở điện thoại thu tờ bằng nút Bản đồ để xem ghim và camera.
  { id: 'dest-map', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.shell-map-view[data-ready="1"]'); const peek = p.getByRole('button', { name: 'Bản đồ', exact: true }); if (await peek.isVisible()) { await peek.click(); await p.waitForSelector('.app[data-sheet="peek"]'); } await p.waitForTimeout(2500); } },
  { id: 'dest-filter-hiking', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.place-row'); await p.getByRole('group', { name: 'Lọc theo loại' }).getByRole('button', { name: /Trekking|Leo núi/ }).click(); await p.waitForTimeout(500); } },
  // Một template chi tiết: ảnh dọc cạnh 4 thông số; ảnh ngang nằm trên thông số.
  { id: 'place-portrait', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.locator('[data-place-id="cot-co-lung-cu"] .pr-photo').click(); await p.waitForSelector('.panel .pd-media[data-orient]'); await p.waitForTimeout(800); } },
  { id: 'place-landscape', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.locator('[data-place-id="deo-ma-pi-leng"] .pr-photo').click(); await p.waitForSelector('.panel .pd-media[data-orient="landscape"]'); await p.waitForTimeout(800); } },
  { id: 'place-nophoto', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.place-row'); const row = p.locator('.place-row:has(.pr-photo .img-ph)').first(); if (await row.count()) { await row.locator('.pr-photo').click(); await p.waitForSelector('.panel .photo-ph'); } await p.waitForTimeout(500); } },
  { id: 'deck', go: async (p, url) => p.goto(`${url}/#/deck/ha-giang`) },
  { id: 'deck-info', go: async (p, url) => { await p.goto(`${url}/#/deck/ha-giang`); await p.waitForSelector('.card.front'); await p.click('.card.front .card-detail'); await p.waitForSelector('.panel'); } },
  { id: 'place-route', go: async (p, url) => { await p.goto(`${url}/#/deck/ha-giang`); await p.waitForSelector('.card.front'); await p.click('.card.front .card-detail'); await p.waitForSelector('.minimap[data-ready="1"]'); await p.locator('.minimap').scrollIntoViewIfNeeded(); await p.waitForTimeout(1600); } },
  { id: 'picked', go: async (p, url) => { await p.goto(`${url}/#/deck/ha-giang`); await p.waitForSelector('.card.front'); for (let i = 0; i < 4; i += 1) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(450); } await p.goto(`${url}/#/picked`); } },
  { id: 'deck-empty', go: async (p, url) => { await p.goto(`${url}/#/deck/ha-giang`); await p.waitForSelector('.card.front'); for (let i = 0; i < 9; i += 1) { await p.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); await p.waitForTimeout(420); } } },
  { id: 'trips-empty', go: async (p, url) => p.goto(`${url}/#/trips`) },
  { id: 'create-sheet', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.getByRole('button', { name: 'Tạo chuyến đi' }).click(); await p.waitForSelector('.panel'); } },
  { id: 'wizard-review', go: async (p, url) => { await p.goto(`${url}/#/trips`); await p.getByRole('button', { name: 'Đi khám phá' }).waitFor(); await p.goto(`${url}/#/dest/ha-giang`); await p.getByRole('button', { name: 'Tạo chuyến đi' }).click(); await p.waitForSelector('.panel'); } },
  { id: 'trips-list', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trips`); await p.waitForSelector('.tcard'); } },
  { id: 'trip-raw', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.waitForTimeout(6000); } },
  { id: 'trip-ov', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.waitForSelector('.mapbox .tmroot[data-ready="1"]'); await p.waitForTimeout(1200); } },
  // Chế độ mới của chuyến: Chưa xếp (chọn nhanh ngày + Xếp N nơi), Chi phí, và nhóm Người đi cùng/Chia sẻ ngay trên bìa.
  { id: 'trip-unassigned', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/un`); await p.waitForSelector('.unassigned-tab .assign'); await p.waitForTimeout(800); } },
  { id: 'trip-cost', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/cost`); await p.waitForSelector('.trip-cost'); await p.waitForTimeout(800); } },
  { id: 'trip-people', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.locator('.tcc-actions .btn').first().click(); await p.waitForSelector('.panel'); await p.waitForTimeout(800); } },
  { id: 'trip-share', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.locator('.tcc-actions .btn').last().click(); await p.getByRole('dialog', { name: 'Chia sẻ chuyến đi' }).waitFor(); } },
  { id: 'trip-checklist', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.locator('.tcc-actions .btn').first().click(); await p.getByRole('button', { name: 'Chuẩn bị trước chuyến đi', exact: true }).click(); await p.getByLabel('Hạng mục', { exact: true }).fill('Giấy tờ cá nhân'); await p.getByRole('button', { name: 'Thêm hạng mục', exact: true }).click(); await p.locator('.chk').waitFor(); } },
  { id: 'trip-requests', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.locator('.tcc-actions .btn').first().click(); await p.getByRole('button', { name: 'Đề nghị xóa', exact: true }).click(); await p.getByRole('dialog', { name: 'Đề nghị xóa', exact: true }).waitFor(); } },
  // Gợi ý quán ăn/cafe từ tập POI phụ trợ thật (API/UI đã có): phải còn hoạt động sau khi đổi UI chuyến đi.
  { id: 'trip-meal', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/2`); await p.getByRole('button', { name: 'Thêm ăn uống / nghỉ' }).click(); await p.getByRole('button', { name: 'Bữa trưa' }).click(); await p.getByRole('button', { name: 'Gợi ý quán gần lịch ngày này', exact: true }).click(); await p.getByRole('dialog', { name: 'Gợi ý quán gần', exact: true }).waitFor(); await p.waitForTimeout(1500); } },
  { id: 'trip-suggestion', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/un`); await p.getByRole('button', { name: /^Xếp \d+ nơi/ }).click(); await p.waitForSelector('.panel .plan-days-grid'); await p.waitForTimeout(800); } },
  { id: 'trip-ov-scrolled', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.waitForSelector('.sheet-scroll'); await p.getByRole('tab', { name: 'Tổng quan' }).click(); await p.evaluate(() => { const el = document.querySelector('.sheet-scroll'); if (el) el.scrollTop = 520; }); await p.waitForTimeout(600); } },
  { id: 'trip-day1', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/1`); await p.waitForSelector('.mapbox .tmroot[data-ready="1"]'); await p.waitForTimeout(1600); } },
  { id: 'trip-day1-sort', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/1`); await p.getByRole('button', { name: 'Sắp xếp' }).click(); await p.waitForTimeout(500); } },
  { id: 'item-editor', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/1`); await p.locator('.irow', { hasText: 'Ăn trưa' }).click(); await p.waitForSelector('.panel'); } },
  { id: 'auto-plan', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/ov`); await p.getByRole('button', { name: /^Xếp \d+ nơi/ }).click(); await p.waitForSelector('.plan-days-grid'); } },
  { id: 'trip-trash', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/1`); for (const name of ['Ăn trưa (mẫu)', 'Homestay Đồng Văn (mẫu)']) { await p.locator('.irow', { hasText: name }).click(); await p.getByRole('dialog').getByRole('button', { name: 'Xóa khỏi chuyến đi' }).click(); await p.waitForTimeout(350); } await p.getByRole('tab', { name: 'Tổng quan' }).click(); await p.getByRole('button', { name: /Đã xóa gần đây/ }).click(); await p.waitForSelector('.trashrow'); await p.waitForTimeout(500); } },
  { id: 'security', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, { withCode: true, tablet: true }); await p.goto(`${url}/#/security`); await p.waitForSelector('.seccard'); await p.waitForTimeout(400); } },
  { id: 'security-nocode', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, {}); await p.goto(`${url}/#/security`); await p.waitForSelector('.seccard'); await p.waitForTimeout(400); } },
  { id: 'recover', go: async (p, url) => { await p.goto(`${url}/#/`); await p.evaluate(() => localStorage.clear()); await p.goto(`${url}/#/recover`); await p.reload(); await p.waitForSelector('.pagehead'); await p.waitForTimeout(400); } },
  { id: 'identity-intro', go: async (p, url) => { await p.goto(`${url}/#/trips`); await p.getByRole('button', { name: 'Tạo chuyến đi' }).first().click(); await p.getByRole('button', { name: 'Tạo chuyến đi' }).last().click(); await p.getByRole('heading', { name: 'Lưu chuyến đi của bạn' }).waitFor(); await p.waitForTimeout(500); } },
  { id: 'identity-code', go: async (p, url) => { await p.goto(`${url}/#/trips`); await p.getByRole('button', { name: 'Tạo chuyến đi' }).first().click(); await p.getByRole('button', { name: 'Tạo chuyến đi' }).last().click(); await p.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click(); await p.waitForSelector('.codebox'); await p.waitForTimeout(500); } },
  { id: 'identity-challenge', go: async (p, url) => { await p.goto(`${url}/#/trips`); await p.getByRole('button', { name: 'Tạo chuyến đi' }).first().click(); await p.getByRole('button', { name: 'Tạo chuyến đi' }).last().click(); await p.getByRole('button', { name: 'Tạo danh tính và nhận mã' }).click(); await p.getByRole('button', { name: 'Tôi đã lưu mã, tiếp tục' }).click(); await p.getByRole('heading', { name: 'Nhập lại 2 nhóm để xác nhận' }).waitFor(); await p.waitForTimeout(500); } },
  { id: 'pair-confirm', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, { withCode: true }); await p.goto(`${url}/#/security`); await p.getByRole('button', { name: 'Giả lập: máy mới xin ghép' }).click(); const code = await p.evaluate(() => JSON.parse(localStorage.getItem('wander.web.server.v1') ?? '{}').pairing.code); await p.getByLabel('Mã ghép trên máy mới').fill(code); await p.getByRole('button', { name: 'Tiếp tục' }).click(); await p.getByRole('heading', { name: 'Duyệt thiết bị mới?' }).waitFor(); await p.waitForTimeout(500); } },
  { id: 'onboard-1', go: async (p, url) => { await p.goto(`${url}/#/onboard`); await p.waitForSelector('#screen[data-view="onboard"] .ob-sky'); await p.waitForTimeout(1500); } },
  { id: 'onboard-2', go: async (p, url) => { await p.goto(`${url}/#/onboard`); await p.waitForSelector('#screen[data-view="onboard"] .ob-sky'); await p.getByRole('button', { name: 'Tiếp' }).click(); await p.waitForTimeout(2500); } },
  { id: 'onboard-3', go: async (p, url) => { await p.goto(`${url}/#/onboard`); await p.waitForSelector('#screen[data-view="onboard"] .ob-sky'); await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await p.getByRole('button', { name: 'Tiếp', exact: true }).click(); await p.getByRole('button', { name: 'Bắt đầu khám phá' }).waitFor(); await p.waitForTimeout(3500); } },
  { id: 'templates', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.tplcard'); await p.locator('.tplrow').scrollIntoViewIfNeeded(); await p.waitForTimeout(800); } },
  { id: 'template-sheet', go: async (p, url) => { await p.goto(`${url}/#/dest/ha-giang`); await p.waitForSelector('.tplcard'); await p.locator('.tplcard').first().click(); await p.getByRole('heading', { name: 'Ngày 1' }).waitFor(); await p.waitForTimeout(600); } },
  { id: 'today-before', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/today`); await p.waitForSelector('.empty'); await p.waitForTimeout(500); } },
  { id: 'today-day1', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/today`); await p.waitForSelector('input[type=date]'); const start = await p.evaluate(() => JSON.parse(localStorage.getItem('wander.web.trips.v1') ?? '{}').trips[0].startDate); await p.fill('input[type=date]', start); await p.waitForSelector('.todayrow'); await p.waitForTimeout(500); } },
  { id: 'today-day2', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/today`); await p.waitForSelector('input[type=date]'); const d = await p.evaluate(() => { const t = JSON.parse(localStorage.getItem('wander.web.trips.v1') ?? '{}').trips[0]; const x = new Date(t.startDate + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); }); await p.fill('input[type=date]', d); await p.waitForSelector('.taskchk'); await p.waitForTimeout(500); } },
  { id: 'export-image', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/export/mau-ha-giang`); await p.waitForSelector('.png-export-image', { timeout: 45000 }); await p.waitForTimeout(500); } },
  { id: 'export-pdf', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/export/mau-ha-giang`); await p.getByRole('button', { name: 'PDF' }).click(); await p.waitForSelector('.exptable'); await p.waitForTimeout(500); } },
  { id: 'export-calendar', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/export/mau-ha-giang`); await p.getByRole('button', { name: 'Lịch' }).click(); await p.waitForSelector('.evlist'); await p.waitForTimeout(500); } },
  { id: 'settings', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, { withCode: true, tablet: true }); await p.goto(`${url}/#/settings`); await p.waitForSelector('.seccard'); await p.waitForTimeout(400); } },
  { id: 'error-code', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, { withCode: true }); await p.goto(`${url}/#/settings`); await p.getByRole('button', { name: 'RATE_LIMITED' }).click(); await p.waitForSelector('.errbox'); await p.locator('.errbox').scrollIntoViewIfNeeded(); await p.waitForTimeout(400); } },
  { id: 'expired-a', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, { withCode: true }); await p.goto(`${url}/#/settings`); await p.getByRole('button', { name: 'Giả lập: hết phiên' }).click(); await p.getByRole('heading', { name: 'Phiên đã hết' }).waitFor(); await p.waitForTimeout(400); } },
  { id: 'expired-b', go: async (p, url) => { await p.goto(`${url}/#/`); await seedIdentity(p, {}); await p.goto(`${url}/#/settings`); await p.getByRole('button', { name: 'Giả lập: hết phiên' }).click(); await p.getByRole('heading', { name: 'Không khôi phục được' }).waitFor(); await p.waitForTimeout(400); } },
  { id: 'trip-place-sheet', go: async (p, url) => { await seedTrips(p); await p.goto(`${url}/#/trip/mau-ha-giang/1`); await p.locator('.irow', { hasText: 'Đình' }).or(p.locator('.irow', { hasText: 'Dinh' })).first().click(); await p.waitForSelector('.panel .pd-photo'); await p.waitForTimeout(500); } },
];
