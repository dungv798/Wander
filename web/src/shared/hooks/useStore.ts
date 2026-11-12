import { useSyncExternalStore } from 'react';
import type { PersistentStore } from '../state/PersistentStore.ts';

/** Reads the current state of a `PersistentStore` and re-renders when it changes. */
export function useStore<T extends object>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
