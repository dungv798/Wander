import { useMemo } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { useResource } from '../../../shared/hooks/useResource.ts';
import type { ResourceState } from '../../../shared/hooks/useResource.ts';
import { useDestination } from '../../discover/index.ts';
import { HttpTemplateRepository } from '../api/HttpTemplateRepository.ts';
import type { TemplateRepository } from '../api/TemplateRepository.ts';
import type { TemplateView } from '../model/template.types.ts';
import { toTemplateViews } from '../model/templateMapper.ts';

/** The app's shared store: calls the backend's sample-itinerary API. */
const DEFAULT_REPOSITORY: TemplateRepository = new HttpTemplateRepository(apiClient);

/** The sample itineraries of a destination joined with the place catalog (waits for both to load). A network error returns `error` so the screen decides (the block hides, it does not block the page). */
export function useTemplates(destId: string, repo: TemplateRepository = DEFAULT_REPOSITORY): { state: ResourceState<TemplateView[]>; retry: () => void } {
  const dest = useDestination(destId).state;
  const raw = useResource(() => repo.templates(destId), [repo, destId]);
  const state = useMemo<ResourceState<TemplateView[]>>(() => {
    if (dest.status === 'error') return dest;
    if (raw.state.status === 'error') return raw.state;
    if (dest.status !== 'ready' || raw.state.status !== 'ready') return { status: 'loading' };
    return { status: 'ready', data: toTemplateViews(raw.state.data, dest.data) };
  }, [dest, raw.state]);
  return { state, retry: raw.retry };
}
