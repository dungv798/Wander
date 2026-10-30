import type { Locator, Page } from 'playwright-core';

/** Chạy một bước chờ; thất bại thì kèm cây trợ năng (rút gọn) của vùng chỉ định để biết tên/nội dung thật. */
export async function withAria<T>(page: Page, scope: Locator | string, step: () => Promise<T>): Promise<T> {
  try {
    return await step();
  } catch (error) {
    const root = typeof scope === 'string' ? page.locator(scope).first() : scope;
    const snapshot = await root.ariaSnapshot({ timeout: 5000 }).catch(() => 'không đọc được cây trợ năng');
    throw new Error(`Bước chờ thất bại; cây trợ năng:\n${snapshot.slice(0, 1800)}`, { cause: error });
  }
}
