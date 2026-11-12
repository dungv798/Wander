import type { DestinationDetail } from './Catalog.types.ts';

/** Giới hạn của bản lưu điểm đến: khóa, số điểm đến giữ lại và cỡ tối đa của một bản (ký tự JSON). */
export const DESTINATION_CACHE_LIMITS = {
  KEY: 'wander.web.catalog.destinations.v1',
  MAX_ENTRIES: 4,
  MAX_CHARS: 600_000,
} as const;

/** Phần của `Storage` mà bản lưu dùng. */
export type DestinationStorage = Pick<Storage, 'getItem' | 'setItem'>;

interface Entry {
  readonly id: string;
  readonly savedAt: number;
  readonly data: DestinationDetail;
}

/** Kho mặc định của trình duyệt; null khi bị chặn. */
function browserStorage(): DestinationStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Một điểm đến đủ hình dạng tối thiểu để màn hình dùng không vỡ (cùng tiêu chí với kiểm tra khi tải từ API). */
function looksLikeDetail(v: unknown): v is DestinationDetail {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string'
    && Array.isArray(v['places']) && Array.isArray(v['guide']) && Array.isArray(v['references']);
}

/** Đọc các mục đã lưu; mục hỏng bị bỏ, kho hỏng coi như rỗng. */
function readEntries(storage: DestinationStorage | null): Entry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(DESTINATION_CACHE_LIMITS.KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    const list = isRecord(parsed) && Array.isArray(parsed['entries']) ? parsed['entries'] : [];
    return list.filter((e): e is Entry => isRecord(e) && typeof e['id'] === 'string' && typeof e['savedAt'] === 'number' && looksLikeDetail(e['data']));
  } catch {
    return [];
  }
}

/**
 * Lưu bản điểm đến gần nhất tải được để vẫn xem lịch/chi tiết khi máy chủ không trả lời (B-09, DR-037). Giữ vài điểm đến mới nhất, bỏ bản quá lớn,
 * và im lặng khi hết hạn mức: đây chỉ là tiện ích, không được làm hỏng luồng chính.
 */
export function saveCachedDestination(detail: DestinationDetail, now: number, storage: DestinationStorage | null = browserStorage()): void {
  const text = JSON.stringify({ id: detail.id, savedAt: now, data: detail });
  if (!storage || text.length > DESTINATION_CACHE_LIMITS.MAX_CHARS) return;
  const others = readEntries(storage).filter((e) => e.id !== detail.id);
  const entries = [{ id: detail.id, savedAt: now, data: detail }, ...others]
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, DESTINATION_CACHE_LIMITS.MAX_ENTRIES);
  try {
    storage.setItem(DESTINATION_CACHE_LIMITS.KEY, JSON.stringify({ entries }));
  } catch {
    /* hết hạn mức: không lưu */
  }
}

/** Bản đã lưu của một điểm đến; null nếu chưa có hoặc hỏng. */
export function loadCachedDestination(id: string, storage: DestinationStorage | null = browserStorage()): DestinationDetail | null {
  return readEntries(storage).find((e) => e.id === id)?.data ?? null;
}
