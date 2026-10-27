import { useSyncExternalStore } from 'react';
import type { PersistentStore } from '../state/PersistentStore.ts';

/** Đọc trạng thái hiện tại của một `PersistentStore` và render lại khi nó đổi. */
export function useStore<T extends object>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}
