import { useMemo } from 'react';
import { useResource } from '../../../shared/hooks/useResource.ts';
import type { ResourceState } from '../../../shared/hooks/useResource.ts';
import { useDestination } from '../../discover/index.ts';
import { StaticTemplateRepository } from '../api/StaticTemplateRepository.ts';
import type { TemplateRepository } from '../api/TemplateRepository.ts';
import type { TemplateView } from '../model/template.types.ts';
import { toTemplateViews } from '../model/templateMapper.ts';

/** Kho dùng chung của ứng dụng (bản giả); FE-10 đổi thành kho gọi API. */
const DEFAULT_REPOSITORY: TemplateRepository = new StaticTemplateRepository();

/** Lịch mẫu của một điểm đến đã ghép với kho địa điểm (đợi cả hai tải xong). Lỗi mạng trả `error` để màn tự quyết (khối ẩn đi, không chặn trang). */
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
