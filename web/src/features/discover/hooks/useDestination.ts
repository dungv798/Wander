import { useResource } from '../../../shared/hooks/useResource.ts';
import type { ResourceState } from '../../../shared/hooks/useResource.ts';
import type { DestinationDetail } from '../model/Catalog.types.ts';
import { useDiscover } from './DiscoverProvider.tsx';

/** Loads one full destination (cancels the old request when the id changes). Returns the merged state and `retry`. */
export function useDestination(id: string): { state: ResourceState<DestinationDetail>; retry: () => void } {
  const { catalog } = useDiscover();
  return useResource((signal) => catalog.destination(id, signal), [catalog, id]);
}
