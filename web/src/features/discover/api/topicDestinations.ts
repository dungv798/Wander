import type { DestinationSummary } from '../model/Catalog.types.ts';
import { matchesDiscoveryFilter } from '../model/discoveryFilters.ts';
import type { CatalogRepository } from './CatalogRepository.ts';

/** Lọc trên tóm tắt; chỉ tải bù chi tiết cho API cũ thiếu metadata, không tải cả kho ở mỗi lần đổi chủ đề. */
export async function topicDestinations(destinations: readonly DestinationSummary[], topic: string, catalog: CatalogRepository, signal?: AbortSignal): Promise<DestinationSummary[]> {
  if (topic === 'all') return [...destinations];
  const matches = await Promise.all(destinations.map(async destination => {
    const categories = destination.categories;
    if (categories) return categories.some(category => matchesDiscoveryFilter({ category }, topic));
    const detail = await catalog.destination(destination.id, signal);
    return detail.places.some(place => matchesDiscoveryFilter(place, topic));
  }));
  signal?.throwIfAborted();
  return destinations.filter((_, index) => matches[index]);
}
