/** Mô tả một cờ bật/tắt điều khiển bằng tham số URL và nhớ trong kho. */
export interface UrlFlagSpec {
  readonly param: string;
  readonly storageKey: string;
  readonly on: string;
  readonly off: string;
}

/**
 * Đọc lựa chọn của người dùng cho một cờ: tham số URL (ngoài hash được ưu tiên, rồi trong hash) bật hoặc tắt và ĐƯỢC NHỚ (cả hai chiều, để "tắt" có nghĩa
 * khi mặc định là bật); không có tham số thì dùng giá trị đã nhớ. Trả \`null\` khi người dùng chưa chọn gì (nơi gọi quyết định mặc định). Kho bị chặn hoặc lỗi thì chỉ theo URL.
 */
export function readUrlFlag(spec: UrlFlagSpec, location: Pick<Location, 'search' | 'hash'>, storage: Pick<Storage, 'getItem' | 'setItem'> | null): boolean | null {
  const requested = new URLSearchParams(location.search).get(spec.param) ?? new URLSearchParams(location.hash.split('?')[1] ?? '').get(spec.param);
  const explicit = requested === spec.on ? true : requested === spec.off ? false : null;
  try {
    if (explicit !== null) {
      storage?.setItem(spec.storageKey, explicit ? spec.on : spec.off);
      return explicit;
    }
    const stored = storage?.getItem(spec.storageKey);
    return stored === spec.on ? true : stored === spec.off ? false : null;
  } catch {
    return explicit;
  }
}
