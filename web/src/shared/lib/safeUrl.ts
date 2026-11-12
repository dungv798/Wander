const SAFE_PROTOCOLS: readonly string[] = ['https:', 'http:'];

/** The first two characters are '/' then '/' or a backslash: the browser reads it as another host (protocol-relative). */
const CROSS_ORIGIN_PATH = /^\/[\\/]/;

/** Returns the address if it is a valid http(s); otherwise `undefined` (blocks `javascript:`, `data:`... before it goes into `href`). */
export function safeHttpUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Like `safeHttpUrl` but also accepts a same-origin path (`/catalog/photos/a.jpg`), used for photos served by the server itself.
 * Blocks `//host` and `/\host` (the browser reads them as another host), `javascript:`, `data:` and a relative path without a leading `/`.
 */
export function safeLinkUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('/')) return CROSS_ORIGIN_PATH.test(value) ? undefined : value;
  return safeHttpUrl(value);
}
