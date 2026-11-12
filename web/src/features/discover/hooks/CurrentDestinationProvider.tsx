import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useResource } from '../../../shared/hooks/useResource.ts';
import { readDestination, resolveDestination, selectedDestination, writeDestination } from '../model/destinationSelection.ts';
import type { DestinationSummary } from '../model/Catalog.types.ts';
import { useDiscover } from './DiscoverProvider.tsx';

interface CurrentDestinationValue {
  readonly destId: string;
  readonly selectedId: string | null;
  readonly destinations: readonly DestinationSummary[];
  readonly status: 'loading' | 'error' | 'ready';
  readonly retry: () => void;
  readonly select: (id: string) => void;
}
const CurrentDestinationContext = createContext<CurrentDestinationValue | null>(null);
const NO_DESTINATIONS: readonly DestinationSummary[] = [];

/** The shared selection store; validates the code saved on this device against the catalog once it has loaded. */
export function CurrentDestinationProvider({ children }: { readonly children: ReactNode }) {
  const { catalog } = useDiscover();
  const { state, retry } = useResource((signal) => catalog.searchDestinations('', signal), [catalog]);
  const [saved, setSaved] = useState(readDestination);
  const destinations = state.status === 'ready' ? state.data : NO_DESTINATIONS;
  const loadedDestinations = state.status === 'ready' ? state.data : undefined;
  const destId = resolveDestination(saved, loadedDestinations);
  const selectedId = selectedDestination(saved, loadedDestinations);
  /** Only a valid code is chosen; it is saved right before switching screens or reloading. */
  function select(id: string): void {
    const valid = selectedDestination(id, loadedDestinations);
    if (!valid) return;
    setSaved(valid);
    writeDestination(undefined, valid);
  }
  return <CurrentDestinationContext.Provider value={{ destId, selectedId, destinations, status: state.status, retry, select }}>{children}</CurrentDestinationContext.Provider>;
}

/** Reads the current destination from the app's shared store. */
export function useCurrentDestination(): CurrentDestinationValue {
  const context = useContext(CurrentDestinationContext);
  if (!context) throw new Error('CurrentDestinationProvider');
  return context;
}
