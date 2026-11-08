// Kiểm thử đầu-cuối của giao diện web/ (pha FE, API giả) trên trình duyệt thật (Chrome hoặc Edge đã cài), khung nhìn điện thoại.
// Chạy: `npm run e2e` (tự mở máy chủ Vite có kho biên tập thật). KHÔNG thay thế `e2e/browser.test.ts` của gốc repo (chạy với backend Java, FE-10).
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { chromium } from 'playwright-core';
import { withAria } from './diag.ts';
import type { Browser, BrowserContext, Page } from 'playwright-core';
import { tapNativeFeature, waitForNativeMap } from './mapChecks.ts';

const FIRST_PLACE = 'Đi chợ ở Đồng Văn';
let server: ViteDevServer;
let browser: Browser;
let baseUrl = '';

/** Mở trang trắng (xóa lưu trữ) ở khung điện thoại và đi tới một địa chỉ hash. */
async function open(ctx: BrowserContext, hash: string): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('wander.web.destination.v1', 'ha-giang');
    localStorage.setItem('wander.web.onboarding.v1', '{"done":true}'); // bỏ qua giới thiệu lần đầu (có test riêng)
  });
  await page.reload(); // kho "đã xem giới thiệu" đọc lúc khởi tạo nên phải nạp lại
  await page.goto(`${baseUrl}/${hash}`);
  return page;
}

test.before(async () => {
  server = await createServer({ configFile: path.resolve(import.meta.dirname, '../vite.config.ts'), server: { port: 0 }, logLevel: 'error' });
  await server.listen();
  baseUrl = (server.resolvedUrls?.local[0] ?? '').replace(/\/$/, '');
  browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
});

test.after(async () => {
  await browser?.close();
  await server?.close();
});

/** Tạo ngữ cảnh điện thoại 390×844 và ghi lại lỗi console/trang để test khẳng định không có lỗi. */
async function phone(): Promise<{ ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'vi-VN' });
  const errors: string[] = [];
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  });
  return { ctx, errors };
}

test('trang chủ mở màn chọn điểm đến và tìm không khớp', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/');
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  assert.ok(await page.locator('.home-topics .fchip').count() >= 4);
  await page.locator('.map-chrome .search').click();
  await page.getByRole('searchbox').fill('zzz');
  await page.getByRole('status').getByText('Chưa có điểm đến này', { exact: true }).waitFor();
  await page.getByRole('searchbox').fill('ha gi');
  await page.locator('.destination-picker-list button', { hasText: 'Hà Giang' }).click();
  await page.waitForURL(/#\/dest\/ha-giang$/);
  await page.getByRole('button', { name: 'Quẹt khám phá', exact: true }).click();
  await page.waitForURL(/#\/deck\/ha-giang$/);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.getByRole('heading', { name: 'Khám phá Việt Nam', exact: true }).waitFor();
  await page.locator('.home-hero-card .btn').click();
  await page.waitForURL(/#\/dest\/ha-giang$/);
  await page.evaluate(() => { location.hash = '#/'; });
  await page.locator('.home-hero-card .btn').click();
  await page.waitForURL(/#\/dest\/ha-giang$/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('quẹt: phím, hoàn tác, kéo bằng chuột, bộ lọc loại, hết thẻ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  assert.match((await page.locator('.card.front h2').textContent()) ?? '', new RegExp(FIRST_PLACE));
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.keyboard.press('Backspace');
  await page.getByRole('button', { name: 'Xem đã chọn (0)' }).waitFor();
  const box = await page.locator('.card.front').boundingBox();
  assert.ok(box, 'thẻ có kích thước');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.getByRole('button', { name: 'Lọc theo loại', exact: true }).click();
  await page.getByRole('button', { name: 'Trekking' }).click();
  assert.equal(await page.getByRole('button', { name: 'Trekking' }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: 'Lọc theo loại', exact: true }).click();
  assert.match((await page.locator('.card.front h2').textContent()) ?? '', /Tây Côn Lĩnh/);
  await page.keyboard.press('ArrowLeft');
  await page.getByText('Hết thẻ ở loại này').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('chi tiết địa điểm: hộp thoại có nhãn, Esc đóng và trả focus; đổi ảnh bằng nút', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  const infoBtn = page.getByRole('button', { name: 'Xem chi tiết' });
  await infoBtn.click();
  const dialog = page.getByRole('dialog', { name: FIRST_PLACE });
  await dialog.waitFor();
  await assertPlaceImage(page);
  assert.equal(await dialog.locator('.pd-count').textContent(), '1 / 3');
  await dialog.getByRole('button', { name: 'Ảnh sau' }).click();
  await dialog.locator('.pd-count', { hasText: '2 / 3' }).waitFor();
  await assertPlaceImage(page);
  assert.equal(await dialog.getByRole('link', { name: 'Xem ảnh gốc' }).count(), 1, 'có lối xem ảnh gốc');
  assert.equal(await dialog.locator('.pd-credit').count(), 1, 'ghi công ảnh luôn hiện dưới ảnh');
  assert.match((await dialog.locator('.rate').textContent()) ?? '', /Chỉ ghé nếu tiện/, 'nhãn biên tập, không có điểm sao');
  assert.equal(await dialog.locator('text=/★|sao/').count(), 0, 'không bịa số sao (G1)');
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'detached' });
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Xem chi tiết', 'focus về nút đã mở');
  assert.match(page.url(), /#\/deck\/ha-giang$/, 'Escape chỉ đóng chi tiết, giữ màn nền');
  for (const close of ['button', 'browser-back']) {
    await infoBtn.click();
    await dialog.waitFor();
    if (close === 'button') await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
    else await page.evaluate(() => history.back());
    await dialog.waitFor({ state: 'detached' });
    assert.match(page.url(), /#\/deck\/ha-giang$/, `${close} giữ màn nền`);
    assert.equal(await infoBtn.evaluate(el => document.activeElement === el), true, `${close} trả focus về nút đã mở`);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('đã chọn: lưu trên máy qua tải lại, bỏ chọn, rỗng', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).click();
  await page.locator('.tile').first().waitFor();
  assert.equal(await page.locator('.tile').count(), 1);
  await page.getByRole('button', { name: `Bỏ chọn ${FIRST_PLACE}` }).click();
  await page.getByText('Chưa chọn nơi nào').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('chi tiết dùng ảnh đang xem mở đầu và giảm chuyển động bỏ shared-element', async () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    const { ctx } = await phone();
    const page = await open(ctx, '#/deck/ha-giang');
    await page.emulateMedia({ reducedMotion });
    const card = page.locator('.card.front');
    await card.waitFor();
    await page.waitForFunction(() => {
      const image = document.querySelector<HTMLImageElement>('.card.front img.ph');
      return image?.dataset['imageReady'] === 'true' && !image.hasAttribute('aria-busy') && image.complete && image.naturalWidth > 0;
    });
    const initialPhoto = await card.locator('img.ph').getAttribute('src');
    const box = await card.boundingBox();
    assert.ok(box);
    await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.2);
    // RevealImage giữ src cũ đến khi decode xong; chỉ mở chi tiết khi ảnh mới đã hiện và crossfade kết thúc.
    await page.waitForFunction(previous => {
      const image = document.querySelector<HTMLImageElement>('.card.front img.ph');
      return image?.getAttribute('src') !== previous && image?.dataset['imageReady'] === 'true'
        && !image.hasAttribute('aria-busy') && image.complete && image.naturalWidth > 0
        && !document.querySelector('.card.front .image-outgoing');
    }, initialPhoto);
    const photo = await card.locator('img.ph').getAttribute('src');
    const opener = page.getByRole('button', { name: 'Xem chi tiết' });
    await opener.click();
    const frame = page.locator('.panel .pd-photo');
    await frame.waitFor();
    assert.equal(await frame.locator('img').getAttribute('src'), photo);
    assert.equal(await page.locator('.panel .pd-count').textContent(), '1 / 3');
    if (reducedMotion === 'reduce') {
      assert.equal(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length), 0);
    }
    await page.keyboard.press('Escape');
    await frame.waitFor({ state: 'detached' });
    assert.equal(await opener.evaluate((el) => el === document.activeElement), true);
    await ctx.close();
  }
});

test('cẩm nang: khối mở/đóng đúng aria-expanded, danh sách mang gì đánh dấu được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await page.locator('.guide').waitFor();
  const head = page.getByRole('button', { name: /^Mùa nên đi/ });
  assert.equal(await head.getAttribute('aria-expanded'), 'true');
  await head.click();
  assert.equal(await head.getAttribute('aria-expanded'), 'false');
  await page.getByRole('button', { name: /^Chuẩn bị mang gì/ }).click();
  const pack = page.getByRole('button', { name: 'Áo mưa', exact: true });
  await withAria(page, 'main', () => pack.waitFor({ timeout: 8000 }));
  assert.equal(await pack.getAttribute('aria-pressed'), 'false');
  await pack.click();
  assert.equal(await pack.getAttribute('aria-pressed'), 'true');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('lỗi tải kho: có thông báo, nút Thử lại hoạt động, không trắng trang', async () => {
  const { ctx } = await phone();
  const page = await ctx.newPage();
  await page.route('**/api/catalog/destinations/ha-giang', (r) => r.abort());
  await page.goto(`${baseUrl}/#/dest/ha-giang`);
  await page.getByRole('alert').getByText('Không tải được dữ liệu').waitFor();
  await page.unroute('**/api/catalog/destinations/ha-giang');
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await page.locator('.dest-head h1').waitFor();
  assert.equal(await page.locator('.dest-head h1').textContent(), 'Hà Giang');
  await ctx.close();
});

test('điểm đến: lọc theo loại (có Leo núi/trekking), thẻ nơi có Chọn và Xem chi tiết, Chọn đồng bộ với Đã chọn', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await page.locator('.place-row').first().waitFor();
  const filters = page.getByRole('group', { name: 'Lọc theo loại' });
  assert.ok(await filters.getByRole('button', { name: 'Trekking' }).count() === 1, 'có chip trekking');
  const total = await page.locator('.place-row').count();
  await filters.getByRole('button', { name: 'Trekking' }).click();
  assert.equal(await filters.getByRole('button', { name: 'Trekking' }).getAttribute('aria-pressed'), 'true');
  const hiking = await page.locator('.place-row').count();
  assert.ok(hiking > 0 && hiking < total, 'lọc thu gọn danh sách');
  for (const box of await filters.getByRole('button').all()) assert.ok(((await box.boundingBox())?.height ?? 0) >= 44, 'chip lọc cao ≥ 44 px');
  await filters.getByRole('button', { name: 'Tất cả' }).click();
  const row = page.locator('.place-row', { hasText: FIRST_PLACE });
  await row.getByRole('button', { name: `Chọn ${FIRST_PLACE}` }).click();
  assert.equal(await row.getByRole('button', { name: `Bỏ chọn ${FIRST_PLACE}` }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: /^1 đã chọn/ }).waitFor();
  await row.getByRole('button', { name: `Xem chi tiết ${FIRST_PLACE}` }).first().click();
  await page.getByRole('dialog', { name: FIRST_PLACE }).waitFor();
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Đã chọn' }).getAttribute('aria-pressed'), 'true', 'chi tiết phản ánh trạng thái đã chọn');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('leo núi/trekking: chi tiết KHÔNG suy ra giờ xe máy lên đỉnh, nói thẳng chưa có dữ liệu tuyến, khoảng cách chỉ là điểm tham chiếu', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await page.locator('.place-row').first().waitFor();
  await page.getByRole('group', { name: 'Lọc theo loại' }).getByRole('button', { name: 'Trekking' }).click();
  await page.locator('[data-place-id="tay-con-linh"] .pr-photo').click();
  const dialog = page.getByRole('dialog', { name: 'Tây Côn Lĩnh' });
  await dialog.waitFor();
  const factList = dialog.locator('.place-facts:visible');
  assert.equal(await factList.count(), 1, 'chỉ một bố cục facts hiển thị ở viewport hiện tại');
  const facts = (await factList.textContent()) ?? '';
  assert.doesNotMatch(facts, /xe máy/i, 'không có ô thời gian xe máy cho nơi leo núi');
  assert.match(facts, /Chưa có dữ liệu tuyến/);
  assert.match(facts, /tham chiếu/i, 'khoảng cách ghi rõ là điểm tham chiếu');
  assert.equal(await factList.locator('li').count(), 4);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tìm "trekking" trong màn tìm địa điểm của điểm đến ra các nơi loại Leo núi', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/destinations/places');
  await page.getByRole('searchbox').fill('trekking');
  await page.locator('.destination-picker-list button', { hasText: 'Tây Côn Lĩnh' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

/** Ngữ cảnh máy tính 1280×800 có cảm ứng: bảng trái 480 px che bản đồ, bản đồ chính còn lại bên phải, có nút +/−. */
async function desktop(): Promise<{ ctx: BrowserContext; errors: string[] }> {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, hasTouch: true, locale: 'vi-VN' });
  const errors: string[] = [];
  ctx.on('page', (p) => {
    p.on('pageerror', (e) => errors.push(e.message));
    p.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  });
  return { ctx, errors };
}

/** Mọi ghim nhìn thấy có ảnh trong catalog phải có symbol thật; POI chưa có ảnh không được tính thành ảnh hỏng. */
async function waitForCatalogPhotos(page: Page): Promise<void> {
  const catalog = await (await page.request.get(`${baseUrl}/api/catalog/destinations/ha-giang`)).json() as { destination: { places: { id: string; photos: unknown[] }[] } };
  const photoIds = catalog.destination.places.filter(place => place.photos.length > 0).map(place => place.id);
  await page.waitForFunction(ids => {
    const map = document.querySelector<HTMLElement>('.shell-map-view');
    const features = JSON.parse(map?.dataset['features'] ?? '[]') as { id: string; cluster: boolean }[];
    const expected = features.filter(feature => !feature.cluster && ids.includes(feature.id)).length;
    return expected > 0 && Number(map?.dataset['renderedImages']) === expected;
  }, photoIds, { timeout: 45000 });
}

test('bản đồ chính: ảnh thật khi catalog có ảnh, gộp cụm, phóng bằng nút, chạm ghim mở chi tiết', async () => {
  const { ctx, errors } = await desktop();
  const page = await open(ctx, '#/dest/ha-giang');
  await waitForNativeMap(page, '.shell-map-view');
  assert.equal(await page.locator('.mapcard, .mapbig, .map-section').count(), 0, 'điểm đến không nhúng bản đồ riêng');
  assert.equal(await page.locator('canvas.maplibregl-canvas').count(), 1, 'một canvas bản đồ');
  await waitForCatalogPhotos(page);
  const panel = await page.locator('#screen').boundingBox();
  assert.ok(panel);
  const panelCoverPx = panel.x + panel.width;
  assert.equal(await page.locator('.tm-pin, .tm-cluster, .tm-pin-label').count(), 0, 'ghim/cụm/nhãn được vẽ native');
  assert.match((await page.locator('.shell-map-view .maplibregl-ctrl-attrib').textContent()) ?? '', /OpenStreetMap/, 'ghi công dữ liệu bản đồ');
  assert.ok(Number(await page.locator('.shell-map-view').getAttribute('data-clusters')) >= 1, 'các ghim sát nhau được gộp cụm native');
  const zoomOf = (): Promise<number> => page.locator('.shell-map-view').evaluate((el) => Number((el as HTMLElement).dataset['zoom']));
  const before = await zoomOf();
  await tapNativeFeature(page, '.shell-map-view', true, { left: panelCoverPx });
  await page.waitForFunction((z) => Number(document.querySelector<HTMLElement>('.shell-map-view')?.dataset['zoom']) > z, before, { timeout: 15000 });
  const afterCluster = await zoomOf();
  assert.ok(afterCluster <= 17, 'zoom tách cụm không vượt trần đã duyệt');
  const atMaxZoom = afterCluster === 17;
  await page.locator('.shell-map').getByRole('button', { name: atMaxZoom ? 'Thu nhỏ' : 'Phóng to', exact: true }).click();
  await page.waitForFunction(({ zoom, out }) => {
    const current = Number(document.querySelector<HTMLElement>('.shell-map-view')?.dataset['zoom']);
    return out ? current < zoom : current > zoom;
  }, { zoom: afterCluster, out: atMaxZoom }, { timeout: 15000 });
  assert.equal(await page.locator('.tm-degraded').count(), 0, 'nền bản đồ tải bình thường thì không hiện cảnh báo "một phần nền chưa tải được"');
  const id = await tapNativeFeature(page, '.shell-map-view', false, { left: panelCoverPx });
  const name = await page.locator(`.shell-map-view .tm-accessible button[data-id="${id}"]`).textContent();
  const placeDialog = page.getByRole('dialog', { name: name ?? '' });
  await placeDialog.waitFor();
  await assertPlaceImage(page);
  const photoCount = await placeDialog.locator('.pd-count').count() ? Number((await placeDialog.locator('.pd-count').textContent())?.split('/')[1]?.trim()) : 1;
  if (photoCount > 1) {
    await placeDialog.getByRole('button', { name: 'Ảnh sau' }).click();
    await placeDialog.locator('.pd-count', { hasText: `2 / ${photoCount}` }).waitFor();
    await assertPlaceImage(page);
    await placeDialog.getByRole('button', { name: 'Ảnh trước' }).click();
    await placeDialog.locator('.pd-count', { hasText: `1 / ${photoCount}` }).waitFor();
    await assertPlaceImage(page);
  }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('điện thoại: nút Bản đồ ở điểm đến thu tờ về bản đồ chính (cùng dữ liệu, một canvas) và mở lại được', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await waitForNativeMap(page, '.shell-map-view');
  const markers = await page.locator('.shell-map-view .tm-accessible button').evaluateAll(elements => elements.map(element => (element as HTMLElement).dataset['id']));
  await page.getByRole('button', { name: 'Bản đồ', exact: true }).click();
  await page.locator('.app[data-sheet="peek"]').waitFor();
  assert.equal(await page.locator('canvas.maplibregl-canvas').count(), 1);
  assert.deepEqual(await page.locator('.shell-map-view .tm-accessible button').evaluateAll(elements => elements.map(element => (element as HTMLElement).dataset['id'])), markers, 'thu tờ giữ nguyên ID dữ liệu; số ghim nhìn thấy có thể đổi theo camera');
  await page.getByRole('button', { name: 'Mở lại bảng nội dung' }).click();
  await page.locator('.app[data-sheet="open"]').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

/**
 * Chi tiết chỉ có MỘT ảnh chính, đã tải và giữ đúng tỷ lệ gốc (không crop, không letterbox); hướng ảnh khớp bố cục
 * (dọc → `data-orient="portrait"` đứng cạnh thông số, ngang → trên thông số). Nơi chưa có ảnh: ô giữ chỗ (DR-033).
 */
async function assertPlaceImage(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const frame = document.querySelector('.panel .pd-photo');
    if (!frame) return false;
    const images = frame.querySelectorAll('img');
    if (!images.length) return Boolean(frame.querySelector('.photo-ph'));
    const image = images[0] as HTMLImageElement;
    if (images.length !== 1 || !image.complete || !image.naturalWidth) return false;
    const rect = image.getBoundingClientRect();
    const natural = image.naturalWidth / image.naturalHeight;
    const orient = document.querySelector('.panel .pd-media')?.getAttribute('data-orient');
    return rect.height > 0 && Math.abs(rect.width / rect.height - natural) < 0.03 && orient === (natural < 1 ? 'portrait' : 'landscape');
  });
}

test('lỗi tải kiểu bản đồ: có thông báo và nút Thử lại, các phần khác vẫn dùng được', async () => {
  const { ctx } = await phone();
  const page = await ctx.newPage();
  await page.route('**/styles/liberty', (r) => r.abort());
  await page.goto(`${baseUrl}/#/dest/ha-giang`);
  await page.locator('.shell-map-view .tm-err').waitFor({ timeout: 30000 });
  assert.equal(await page.locator('.dest-head h1').textContent(), 'Hà Giang', 'trang vẫn dựng được khi bản đồ lỗi');
  await page.unroute('**/styles/liberty');
  await page.locator('.shell-map-view .tm-err button').click();
  await waitForNativeMap(page, '.shell-map-view');
  await ctx.close();
});

test('bản đồ native: bàn phím mở chi tiết qua danh sách ghim thay thế canvas', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/dest/ha-giang');
  await waitForNativeMap(page, '.shell-map-view');
  const button = page.locator('.shell-map-view .tm-accessible button').first();
  const name = await button.textContent();
  await button.focus();
  assert.equal(await button.evaluate((element) => element === document.activeElement), true);
  assert.ok((await button.boundingBox())?.height, 'danh sách hiện ra khi nhận focus');
  await page.keyboard.press('Enter');
  await page.getByRole('dialog', { name: name ?? '' }).waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('dữ liệu lưu hỏng không làm trắng trang; ErrorBoundary không bị kích hoạt', async () => {
  const { ctx, errors } = await phone();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${baseUrl}/#/`);
  await page.evaluate(() => localStorage.setItem('wander.web.discover.v1', '{"decisions":null,"history":"x","cat":"khong-co","photo":[1]}'));
  await page.goto(`${baseUrl}/#/deck/ha-giang`);
  await page.locator('.card.front').waitFor();
  assert.equal(await page.getByRole('alert').count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('tờ chi tiết: Tab xoay vòng trong hộp thoại (kể cả phần "Về dữ liệu"), Back của trình duyệt đóng tờ', async () => {
  const { ctx, errors } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  await page.getByRole('button', { name: 'Xem chi tiết' }).click();
  const dialog = page.getByRole('dialog', { name: FIRST_PLACE });
  await dialog.waitFor();
  for (let i = 0; i < 60; i += 1) {
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))), true, `Tab lần ${i + 1} vẫn ở trong hộp thoại`);
  }
  await page.goBack();
  await page.waitForURL(/#\/(dest|explore|#\/)?/);
  await page.getByRole('dialog').waitFor({ state: 'detached' });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('phím Alt+← không bị bộ thẻ nuốt; thẻ đang bay thì Hoàn tác bị bỏ qua', async () => {
  const { ctx } = await phone();
  const page = await open(ctx, '#/deck/ha-giang');
  await page.locator('.card.front').waitFor();
  const first = await page.locator('.card.front').getAttribute('data-id');
  const remaining = await page.locator('.deckbar .note').textContent();
  await page.keyboard.press('Alt+ArrowLeft');
  await page.getByRole('button', { name: 'Xem đã chọn (0)' }).waitFor();
  assert.equal(await page.locator('.card.front').getAttribute('data-id'), first, 'Alt+← không đổi thẻ');
  assert.equal(await page.locator('.deckbar .note').textContent(), remaining, 'Alt+← không giảm số thẻ còn lại');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Backspace');
  await page.getByRole('button', { name: 'Xem đã chọn (1)' }).waitFor();
  await ctx.close();
});
