import { STORAGE } from '../../../shared/const/app.const.ts';
import type { Trip } from './trip.types.ts';

/** Bản chỉ đọc của danh sách chuyến lần nạp thành công gần nhất, để xem được khi máy chủ không trả lời (B-09, DR-037). */
export interface TripsCache {
  readonly trips: readonly Trip[];
  /** Thời điểm lưu, mili giây từ epoch. */
  readonly savedAt: number;
}

/** Phần của `Storage` mà bộ nhớ đệm dùng. */
export type CacheStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** Kho mặc định của trình duyệt; null khi bị chặn (chế độ riêng tư, kho vô hiệu). */
function browserStorage(): CacheStorage | null {
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

/** Một phần tử của bản đã lưu có đủ hình dạng tối thiểu của chuyến (mã, tên, danh sách mục) để giao diện dùng không vỡ. */
function looksLikeTrip(v: unknown): v is Trip {
  return isRecord(v) && typeof v['id'] === 'string' && typeof v['name'] === 'string' && Array.isArray(v['items']);
}

/**
 * Ghi bản chỉ đọc của các chuyến. Hết hạn mức hoặc không có kho thì bỏ qua im lặng (bản lưu chỉ là tiện ích, không được làm hỏng luồng chính).
 * Danh sách rỗng vẫn được ghi để bản cũ không sống lại sau khi người dùng xóa hết chuyến.
 */
export function saveTripsCache(trips: readonly Trip[], now: number, storage: CacheStorage | null = browserStorage()): void {
  try {
    storage?.setItem(STORAGE.TRIPS_CACHE, JSON.stringify({ savedAt: now, trips }));
  } catch {
    /* hết hạn mức hoặc kho bị chặn: không lưu */
  }
}

/** Đọc bản chỉ đọc; null nếu chưa có, hỏng hoặc sai dạng (bản hỏng bị xóa để không đọc lại lần sau). */
export function loadTripsCache(storage: CacheStorage | null = browserStorage()): TripsCache | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE.TRIPS_CACHE);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed) && typeof parsed['savedAt'] === 'number' && Number.isFinite(parsed['savedAt']) && Array.isArray(parsed['trips']) && parsed['trips'].every(looksLikeTrip)) {
      return { trips: parsed['trips'], savedAt: parsed['savedAt'] };
    }
  } catch {
    /* JSON hỏng: rơi xuống dọn */
  }
  clearTripsCache(storage);
  return null;
}

/** Xóa bản chỉ đọc (khi hết phiên, khôi phục hoặc đổi danh tính: chuyến của người khác không được hiện). */
export function clearTripsCache(storage: CacheStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE.TRIPS_CACHE);
  } catch {
    /* bỏ qua */
  }
}
