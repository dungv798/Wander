import assert from 'node:assert/strict';
import type { Page } from 'playwright-core';

/** Đợi renderer có feature, không phụ thuộc DOM ghim đã bị loại bỏ. */
export async function waitForNativeMap(page: Page, selector: string): Promise<void> {
  try {
    await page.waitForFunction((query) => {
      const element = document.querySelector<HTMLElement>(query);
      return element?.dataset['ready'] === '1' && element.dataset['moving'] === '0' && Number(element.dataset['pins']) + Number(element.dataset['clusters']) > 0;
    }, selector, { timeout: 45000 });
  } catch (error) {
    const state = await page.evaluate((query) => {
      const element = document.querySelector<HTMLElement>(query);
      return element ? JSON.stringify({ ...element.dataset, features: undefined }) : `không có phần tử ${query}; hash=${location.hash}`;
    }, selector).catch(() => 'không đọc được trạng thái');
    throw new Error(`Bản đồ ${selector} chưa sẵn sàng: ${state}`, { cause: error });
  }
}

/** Chạm tâm feature từ điểm kiểm chỉ đọc; sự kiện vẫn đi qua hit-test canvas thật. */
export async function tapNativeFeature(page: Page, selector: string, cluster: boolean, covered: { readonly left?: number; readonly bottom?: number } = {}): Promise<string> {
  await waitForNativeMap(page, selector);
  const map = page.locator(selector);
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox();
  assert.ok(box);
  const points = JSON.parse(await map.getAttribute('data-features') ?? '[]') as { id: string; cluster: boolean; x: number; y: number }[];
  // `covered`: phần bản đồ bị bảng nội dung che (bảng trái ở màn rộng, tờ đáy ở điện thoại) không chạm được.
  const left = Math.max(22, covered.left ?? 0);
  const bottom = Math.max(22, covered.bottom ?? 0);
  // Khi ghim chồng cụm, ứng dụng ưu tiên ghim. Để kiểm thao tác cụm, chọn một cụm không bị ghim che thay vì chạm ngẫu nhiên.
  const point = points.find((feature) => feature.cluster === cluster && feature.x >= left && feature.y >= 22 && feature.x < box.width - 22 && feature.y < box.height - bottom
    && (!cluster || !points.some(other => !other.cluster && Math.hypot(other.x - feature.x, other.y - feature.y) < 44)));
  assert.ok(point, 'có feature native trong khung để chạm');
  await page.touchscreen.tap(box.x + point.x, box.y + point.y);
  return point.id;
}
