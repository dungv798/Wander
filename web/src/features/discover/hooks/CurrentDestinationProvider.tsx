import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useResource } from '../../../shared/hooks/useResource.ts';
import { readDestination, resolveDestination, writeDestination } from '../model/destinationSelection.ts';
import type { DestinationSummary } from '../model/Catalog.types.ts';
import { useDiscover } from './DiscoverProvider.tsx';

interface CurrentDestinationValue {
  readonly destId: string;
  readonly destinations: readonly DestinationSummary[];
  readonly status: 'loading' | 'error' | 'ready';
  readonly retry: () => void;
  readonly select: (id: string) => void;
}
const CurrentDestinationContext = createContext<CurrentDestinationValue | null>(null);
const NO_DESTINATIONS: readonly DestinationSummary[] = [];

/** Kho lựa chọn dùng chung; xác thực mã lưu trên máy bằng catalog khi tải xong. */
export function CurrentDestinationProvider({ children }: { readonly children: ReactNode }) {
  const { catalog } = useDiscover();
  const { state, retry } = useResource((signal) => catalog.searchDestinations('', signal), [catalog]);
  const [saved, setSaved] = useState(readDestination);
  const destinations = state.status === 'ready' ? state.data : NO_DESTINATIONS;
  const destId = resolveDestination(saved, destinations);
  useEffect(() => {
    if (state.status === 'ready') writeDestination(undefined, destId);
  }, [state.status, destId]);
  /** Chỉ chọn mã hợp lệ; lưu ngay trước khi chuyển màn hoặc tải lại. */
  function select(id: string): void {
    const valid = resolveDestination(id, destinations);
    setSaved(valid);
    writeDestination(undefined, valid);
  }
  return <CurrentDestinationContext.Provider value={{ destId, destinations, status: state.status, retry, select }}>{children}</CurrentDestinationContext.Provider>;
}

/** Đọc điểm đến hiện tại từ kho chung của ứng dụng. */
export function useCurrentDestination(): CurrentDestinationValue {
  const context = useContext(CurrentDestinationContext);
  if (!context) throw new Error('CurrentDestinationProvider');
  return context;
}
