/** Mô tả một cờ bật/tắt điều khiển bằng tham số URL và nhớ trong kho. */
export interface UrlFlagSpec {
  readonly param: string;
  readonly storageKey: string;
  readonly on: string;
  readonly off: string;
}

/**
 * Đọc cờ từ URL (tham số ngoài hash được ưu tiên, rồi tham số trong hash): `on` bật và ghi nhớ, `off` tắt và xóa; không có tham số thì
 * dùng giá trị đã nhớ. Kho bị chặn hoặc lỗi thì chỉ theo URL.
 */
export function readUrlFlag(spec: UrlFlagSpec, location: Pick<Location, 'search' | 'hash'>, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): boolean {
  const requested = new URLSearchParams(location.search).get(spec.param) ?? new URLSearchParams(location.hash.split('?')[1] ?? '').get(spec.param);
  try {
    if (requested === spec.off) storage?.removeItem(spec.storageKey);
    if (requested === spec.on) storage?.setItem(spec.storageKey, spec.on);
    if (requested !== null) return requested === spec.on;
    return storage?.getItem(spec.storageKey) === spec.on;
  } catch {
    return requested === spec.on;
  }
}
