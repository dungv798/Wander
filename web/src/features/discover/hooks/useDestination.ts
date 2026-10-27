import { useResource } from '../../../shared/hooks/useResource.ts';
import type { ResourceState } from '../../../shared/hooks/useResource.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { useDiscover } from './DiscoverProvider.tsx';

/** Tải một điểm đến đầy đủ (hủy yêu cầu cũ khi đổi mã). Trả trạng thái hợp nhất và `retry`. */
export function useDestination(id: string): { state: ResourceState<DestinationDetail>; retry: () => void } {
  const { catalog } = useDiscover();
  return useResource((signal) => catalog.destination(id, signal), [catalog, id]);
}
