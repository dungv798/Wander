import type { CategoryCode, DestinationSummary } from './Catalog.types.ts';

/** Topics like demo B; the old codes are still accepted when opening a deep link. */
export type DiscoveryFilter = 'all' | CategoryCode;
export const DISCOVERY_FILTER_LABELS: Readonly<Record<DiscoveryFilter, string>> = { all: 'Tất cả', am: 'Món ăn', van: 'Văn hóa', canh: 'Thiên nhiên', leo: 'Trekking', luu: 'Nghỉ lại', cho: 'Chợ' };
const ORDER: readonly DiscoveryFilter[] = ['all', 'am', 'van', 'canh', 'leo', 'luu'];

/** The market belongs to life/culture; trekking also appears in nature, it does not disappear when the topic changes. */
export function matchesDiscoveryFilter(place: { readonly category: CategoryCode }, filter: string | null): boolean {
  return !filter || filter === 'all' || place.category === filter || (filter === 'van' && place.category === 'cho') || (filter === 'canh' && place.category === 'leo');
}

/** Only a topic that has real content is shown; the order always starts with food/culture/nature like B. */
export function discoveryFilters(places: readonly { readonly category: CategoryCode }[]): readonly DiscoveryFilter[] {
  return ORDER.filter(filter => places.some(place => matchesDiscoveryFilter(place, filter)));
}

/** Filters the metadata synchronously; keeps the same list reference if the result set does not change so the camera and photos are not rebuilt. */
export function summaryTopicDestinations(destinations: readonly DestinationSummary[], topic: DiscoveryFilter): readonly DestinationSummary[] {
  if (topic === 'all') return destinations;
  const matched = destinations.filter(destination => destination.categories?.some(category => matchesDiscoveryFilter({ category }, topic)));
  return matched.length === destinations.length ? destinations : matched;
}
