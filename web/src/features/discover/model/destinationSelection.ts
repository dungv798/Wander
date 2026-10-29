import { DEFAULT_DESTINATION_ID } from '../../../shared/const/routes.const.ts';
import { normalizeSearch } from '../../../shared/lib/text.ts';
import { DESTINATION_ID_PATTERN, DESTINATION_STORAGE_KEY } from './destination.const.ts';

interface SearchableDestination { readonly id: string; readonly name: string; readonly region: string }
type DestinationStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Phân biệt lựa chọn thật với mã dự phòng kỹ thuật; catalog đang tải vẫn giữ mã đúng dạng. */
export function selectedDestination(saved: unknown, destinations?: readonly { readonly id: string }[]): string | null {
  if (typeof saved !== 'string' || !DESTINATION_ID_PATTERN.test(saved)) return null;
  return destinations === undefined || destinations.some(destination => destination.id === saved) ? saved : null;
}

/** So khớp tên hoặc vùng không dấu, giữ nguyên thứ tự biên tập. */
export function filterDestinations<T extends SearchableDestination>(destinations: readonly T[], query: string): T[] {
  const normalized = normalizeSearch(query);
  return destinations.filter((destination) => normalizeSearch(destination.name).includes(normalized) || normalizeSearch(destination.region).includes(normalized));
}

/** Catalog chưa tải (undefined): dùng mã lưu đúng dạng ngay; đã tải kể cả rỗng: xác thực tồn tại rồi mới dự phòng. */
export function resolveDestination(saved: unknown, destinations: readonly { readonly id: string }[] | undefined): string {
  if (destinations === undefined) return typeof saved === 'string' && DESTINATION_ID_PATTERN.test(saved) ? saved : DEFAULT_DESTINATION_ID;
  const has = (id: unknown): string | undefined => destinations.find((destination) => destination.id === id)?.id;
  return has(saved) ?? has(DEFAULT_DESTINATION_ID) ?? destinations[0]?.id ?? DEFAULT_DESTINATION_ID;
}

/** Đọc lựa chọn, kể cả trình duyệt chặn quyền truy cập localStorage. */
export function readDestination(storage?: DestinationStorage): string | null {
  try { return (storage ?? window.localStorage).getItem(DESTINATION_STORAGE_KEY); } catch { return null; }
}

/** Ghi lựa chọn theo cơ chế cố gắng, không chặn đổi màn khi hết dung lượng. */
export function writeDestination(storage: DestinationStorage | undefined, id: string): void {
  try { (storage ?? window.localStorage).setItem(DESTINATION_STORAGE_KEY, id); } catch { /* Vẫn dùng được trong phiên hiện tại. */ }
}
