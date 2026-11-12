import type { Page } from 'playwright-core';

/** Đọc dữ liệu catalog thật phục vụ kiểm thử và chụp ảnh giả API. */
export function readCatalog(): readonly unknown[];
/** Gắn tuyến giả không dùng backend hay dữ liệu cá nhân. */
export function mockApi(page: Page, catalog: readonly unknown[]): Promise<void>;
