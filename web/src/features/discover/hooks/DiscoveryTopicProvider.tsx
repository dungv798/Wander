import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useResource } from '../../../shared/hooks/useResource.ts';
import type { CategoryCode, DestinationSummary } from '../model/Catalog.types.ts';
import { useCurrentDestination } from './CurrentDestinationProvider.tsx';
import { useDiscover } from './DiscoverProvider.tsx';
import { topicDestinations } from '../api/topicDestinations.ts';
import { summaryTopicDestinations } from '../model/discoveryFilters.ts';

/** The Discover topic uses the real kind codes to carry the filter over when a destination is opened. */
export type DiscoveryTopic = 'all' | CategoryCode;

/** The list and the map both use the summary metadata to change the topic, without loading the detail of the whole country. */
function useTopicState() {
  const source = useCurrentDestination();
  const { catalog } = useDiscover();
  const [topic, setTopic] = useState<DiscoveryTopic>('all');
  const legacy = useMemo(() => source.destinations.filter(destination => destination.categories === undefined), [source.destinations]);
  const needsLegacy = topic !== 'all' && legacy.length > 0;
  const legacyTopic = needsLegacy ? topic : 'all';
  const known = useMemo(() => summaryTopicDestinations(source.destinations, topic), [source.destinations, topic]);
  const { state, retry } = useResource<DestinationSummary[]>(signal => needsLegacy ? topicDestinations(legacy, legacyTopic, catalog, signal) : Promise.resolve([]), [catalog, legacy, legacyTopic, needsLegacy]);
  const destinations = useMemo(() => {
    if (!needsLegacy || state.status !== 'ready') return known;
    const ids = new Set([...known, ...state.data].map(destination => destination.id));
    return source.destinations.filter(destination => ids.has(destination.id));
  }, [known, source.destinations, needsLegacy, state]);
  return { topic, setTopic, destinations, status: source.status !== 'ready' || !needsLegacy ? source.status : state.status, retry: needsLegacy ? retry : source.retry };
}

const DiscoveryTopicContext = createContext<ReturnType<typeof useTopicState> | null>(null);

/** Shares the same filter and results for both the list and the map, avoiding a filtered list that keeps old pins. */
export function DiscoveryTopicProvider({ children }: { readonly children: ReactNode }) {
  const value = useTopicState();
  return <DiscoveryTopicContext.Provider value={value}>{children}</DiscoveryTopicContext.Provider>;
}

/** Reads the current topic; does not build a separate catalog load request in every component. */
export function useDiscoveryTopic() {
  const context = useContext(DiscoveryTopicContext);
  if (!context) throw new Error('DiscoveryTopicProvider');
  return context;
}
