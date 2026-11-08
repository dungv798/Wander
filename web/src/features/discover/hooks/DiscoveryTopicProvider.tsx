import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useResource } from '../../../shared/hooks/useResource.ts';
import type { CategoryCode, DestinationSummary } from '../model/Catalog.types.ts';
import { useCurrentDestination } from './CurrentDestinationProvider.tsx';
import { useDiscover } from './DiscoverProvider.tsx';
import { topicDestinations } from '../api/topicDestinations.ts';
import { summaryTopicDestinations } from '../model/discoveryFilters.ts';

/** Chủ đề Khám phá dùng mã loại thật để chuyển tiếp bộ lọc khi mở điểm đến. */
export type DiscoveryTopic = 'all' | CategoryCode;

/** Danh sách và bản đồ cùng dùng metadata tóm tắt để đổi chủ đề, không tải chi tiết cả nước. */
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

/** Chia sẻ cùng bộ lọc và kết quả cho danh sách lẫn bản đồ, tránh lọc danh sách nhưng giữ ghim cũ. */
export function DiscoveryTopicProvider({ children }: { readonly children: ReactNode }) {
  const value = useTopicState();
  return <DiscoveryTopicContext.Provider value={value}>{children}</DiscoveryTopicContext.Provider>;
}

/** Đọc chủ đề hiện tại; không dựng riêng yêu cầu tải catalog ở mỗi thành phần. */
export function useDiscoveryTopic() {
  const context = useContext(DiscoveryTopicContext);
  if (!context) throw new Error('DiscoveryTopicProvider');
  return context;
}
