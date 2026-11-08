import type { VenueView } from './Catalog.types.ts';

/** Chỉ URL HTTPS công khai mới được dùng làm liên kết tới cơ sở, không nhận URL nhúng thông tin đăng nhập. */
function safeWeb(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

/** Metadata additive phải đủ nguồn/địa chỉ và mã loại, tránh biến dữ liệu lỗi thành một nút website tùy ý. */
export function isVenueView(value: unknown): value is VenueView {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return ['restaurant', 'cafe', 'bar', 'lodging'].includes(String(v['kind'])) && typeof v['kindName'] === 'string'
    && typeof v['address'] === 'string' && v['address'].trim().length > 0
    && (v['website'] === '' || safeWeb(v['website'])) && safeWeb(v['sourceUrl'])
    && typeof v['checkedAt'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v['checkedAt'])
    && ['phone', 'serviceHours', 'priceNote'].every(key => v[key] === undefined || typeof v[key] === 'string');
}
