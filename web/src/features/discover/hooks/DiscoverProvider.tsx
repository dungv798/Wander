import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { CatalogRepository } from '../api/CatalogRepository.ts';
import { StaticCatalogRepository } from '../api/StaticCatalogRepository.ts';
import * as S from '../model/discoverState.ts';
import type { CategoryFilter, Decision, DiscoverState } from '../model/discoverState.ts';

/** Các thao tác trên trạng thái khám phá (mỗi thao tác là một hàm thuần ở `discoverState.ts`). */
export interface DiscoverActions {
  readonly decide: (placeId: string, d: Decision) => void;
  readonly undo: () => void;
  readonly unpick: (placeId: string) => void;
  readonly clearPicked: (ids: readonly string[]) => void;
  readonly restart: () => void;
  readonly setPhoto: (placeId: string, index: number) => void;
  readonly setCategory: (c: CategoryFilter) => void;
  readonly toggleGuide: (id: string) => void;
  readonly togglePack: (key: string) => void;
  readonly finishOnboarding: () => void;
}

interface DiscoverContextValue {
  readonly catalog: CatalogRepository;
  readonly state: DiscoverState;
  readonly actions: DiscoverActions;
}

const DiscoverContext = createContext<DiscoverContextValue | null>(null);

interface DiscoverProviderProps {
  readonly children: ReactNode;
  /** Thay kho/cửa hàng khi test hoặc khi nối backend thật. */
  readonly catalog?: CatalogRepository;
  readonly store?: PersistentStore<DiscoverState>;
}

/** Cấp kho biên tập và trạng thái khám phá (lưu cục bộ) cho cây giao diện: một nguồn sự thật cho mỗi loại dữ liệu. */
export function DiscoverProvider({ children, catalog, store }: DiscoverProviderProps) {
  const [defaultRepo] = useState(() => new StaticCatalogRepository());
  const repo = catalog ?? defaultRepo;
  const [created] = useState(() => new PersistentStore<DiscoverState>(STORAGE.DISCOVER, S.INITIAL_DISCOVER_STATE, S.sanitizeDiscoverState));
  const kv = store ?? created;
  const state = useStore(kv);
  const actions = useMemo<DiscoverActions>(
    () => ({
      decide: (id, d) => kv.update((s) => S.decide(s, id, d)),
      undo: () => kv.update(S.undoLast),
      unpick: (id) => kv.update((s) => S.unpick(s, id)),
      clearPicked: (ids) => kv.update((s) => S.clearPicked(s, ids)),
      restart: () => kv.update(S.restartSkipped),
      setPhoto: (id, i) => kv.update((s) => S.setPhotoIndex(s, id, i)),
      setCategory: (c) => kv.update((s) => S.setCategory(s, c)),
      toggleGuide: (id) => kv.update((s) => S.toggleGuide(s, id)),
      togglePack: (k) => kv.update((s) => S.togglePack(s, k)),
      finishOnboarding: () => kv.update((s) => ({ ...s, onboarded: true })),
    }),
    [kv],
  );
  const value = useMemo(() => ({ catalog: repo, state, actions }), [repo, state, actions]);
  return <DiscoverContext.Provider value={value}>{children}</DiscoverContext.Provider>;
}

/** Truy cập kho biên tập, trạng thái và thao tác khám phá; ném lỗi nếu quên bọc `DiscoverProvider`. */
export function useDiscover(): DiscoverContextValue {
  const ctx = useContext(DiscoverContext);
  if (!ctx) throw new Error('useDiscover phải nằm trong DiscoverProvider');
  return ctx;
}
