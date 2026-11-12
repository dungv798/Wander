const SAFE_PROTOCOLS: readonly string[] = ['https:', 'http:'];

/** Hai ký tự đầu là "/" rồi "/" hoặc gạch ngược: trình duyệt hiểu là máy chủ khác (protocol-relative). */
const CROSS_ORIGIN_PATH = /^\/[\\/]/;

/** Trả về địa chỉ nếu là http(s) hợp lệ; ngược lại `undefined` (chặn `javascript:`, `data:`... trước khi đưa vào `href`). */
export function safeHttpUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Như `safeHttpUrl` nhưng nhận thêm đường dẫn cùng nguồn (`/catalog/photos/a.jpg`), dùng cho ảnh do chính máy chủ phục vụ.
 * Chặn `//host` và `/\host` (trình duyệt hiểu là máy chủ khác), `javascript:`, `data:` và đường dẫn tương đối không có `/` đầu.
 */
export function safeLinkUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('/')) return CROSS_ORIGIN_PATH.test(value) ? undefined : value;
  return safeHttpUrl(value);
}
