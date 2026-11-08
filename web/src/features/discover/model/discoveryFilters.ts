import type { CategoryCode, DestinationSummary } from './Catalog.types.ts';

/** Chủ đề giống demo B; các mã cũ vẫn được nhận khi mở liên kết sâu. */
export type DiscoveryFilter = 'all' | CategoryCode;
export const DISCOVERY_FILTER_LABELS: Readonly<Record<DiscoveryFilter, string>> = { all: 'Tất cả', am: 'Món ăn', van: 'Văn hóa', canh: 'Thiên nhiên', leo: 'Trekking', luu: 'Nghỉ lại', cho: 'Chợ' };
const ORDER: readonly DiscoveryFilter[] = ['all', 'am', 'van', 'canh', 'leo', 'luu'];

/** Chợ thuộc đời sống/văn hóa; trekking cũng xuất hiện trong thiên nhiên, không biến mất khi đổi chủ đề. */
export function matchesDiscoveryFilter(place: { readonly category: CategoryCode }, filter: string | null): boolean {
  return !filter || filter === 'all' || place.category === filter || (filter === 'van' && place.category === 'cho') || (filter === 'canh' && place.category === 'leo');
}

/** Chỉ hiện chủ đề có nội dung thật; thứ tự luôn bắt đầu bằng món ăn/văn hóa/thiên nhiên như B. */
export function discoveryFilters(places: readonly { readonly category: CategoryCode }[]): readonly DiscoveryFilter[] {
  return ORDER.filter(filter => places.some(place => matchesDiscoveryFilter(place, filter)));
}

/** Lọc metadata đồng bộ; giữ đúng tham chiếu danh sách nếu tập kết quả không đổi để camera và ảnh không dựng lại. */
export function summaryTopicDestinations(destinations: readonly DestinationSummary[], topic: DiscoveryFilter): readonly DestinationSummary[] {
  if (topic === 'all') return destinations;
  const matched = destinations.filter(destination => destination.categories?.some(category => matchesDiscoveryFilter({ category }, topic)));
  return matched.length === destinations.length ? destinations : matched;
}
