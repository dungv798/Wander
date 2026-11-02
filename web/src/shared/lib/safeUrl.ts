const SAFE_PROTOCOLS: readonly string[] = ['https:', 'http:'];

/** Trả về địa chỉ nếu là http(s) hợp lệ; ngược lại `undefined` (chặn `javascript:`, `data:`... trước khi đưa vào `href`). */
export function safeHttpUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}
