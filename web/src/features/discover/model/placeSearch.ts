import { normalizeSearch } from '../../../shared/lib/text.ts';

interface SearchablePlace {
  readonly name: string;
  readonly categoryName: string;
  readonly area: string;
  readonly hook: string;
}

/** Số kết quả địa điểm tối đa hiện cùng lúc ở màn tìm kiếm. */
export const PLACE_SEARCH_LIMIT = 30;

/**
 * Tìm địa điểm của MỘT điểm đến theo tên, loại, khu vực hoặc đặc trưng ngắn (không dấu, không phân biệt hoa thường).
 * Truy vấn rỗng trả danh sách theo thứ tự biên tập. Tên khớp được xếp trước các khớp ở trường khác.
 */
export function searchPlaces<T extends SearchablePlace>(places: readonly T[], query: string): T[] {
  const q = normalizeSearch(query);
  if (!q) return [...places];
  const byName = places.filter((p) => normalizeSearch(p.name).includes(q));
  const others = places.filter((p) => !byName.includes(p) && [p.categoryName, p.area, p.hook].some((f) => normalizeSearch(f).includes(q)));
  return [...byName, ...others];
}
