import assert from 'node:assert/strict';
import type { Page } from 'playwright-core';

/** Đợi renderer có feature, không phụ thuộc DOM ghim đã bị loại bỏ. */
export async function waitForNativeMap(page: Page, selector: string): Promise<void> {
  await page.waitForFunction((query) => {
    const element = document.querySelector<HTMLElement>(query);
    return element?.dataset['ready'] === '1' && Number(element.dataset['pins']) + Number(element.dataset['clusters']) > 0;
  }, selector, { timeout: 45000 });
}

/** Chạm tâm feature từ điểm kiểm chỉ đọc; sự kiện vẫn đi qua hit-test canvas thật. */
export async function tapNativeFeature(page: Page, selector: string, cluster: boolean): Promise<string> {
  const map = page.locator(selector);
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox();
  assert.ok(box);
  const points = JSON.parse(await map.getAttribute('data-features') ?? '[]') as { id: string; cluster: boolean; x: number; y: number }[];
  const point = points.find((feature) => feature.cluster === cluster && feature.x >= 22 && feature.y >= 22 && feature.x < box.width - 22 && feature.y < box.height - 22);
  assert.ok(point, 'có feature native trong khung để chạm');
  await page.touchscreen.tap(box.x + point.x, box.y + point.y);
  return point.id;
}
