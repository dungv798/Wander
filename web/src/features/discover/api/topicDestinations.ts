import type { DestinationSummary } from '../model/Catalog.types.ts';
import { matchesDiscoveryFilter } from '../model/discoveryFilters.ts';
import type { CatalogRepository } from './CatalogRepository.ts';

/** Filters on the summary; only loads the detail to make up for an old API that lacks metadata, and does not load the whole catalog on every topic change. */
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
