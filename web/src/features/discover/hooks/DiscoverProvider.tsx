import { apiClient } from '../../../shared/api/defaultClient.ts';
import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { CatalogRepository } from '../api/CatalogRepository.ts';
import { HttpCatalogRepository } from '../api/HttpCatalogRepository.ts';
import * as S from '../model/discoverState.ts';
import type { CategoryFilter, Decision, DiscoverState } from '../model/discoverState.ts';

/** The actions on the discover state (each action is a pure function in `discoverState.ts`). */
export interface DiscoverActions {
  readonly decide: (placeId: string, d: Decision) => void;
  readonly undo: () => void;
  readonly unpick: (placeId: string) => void;
  readonly clearPicked: (ids: readonly string[]) => void;
  /** Marks the places that were liked as already in a trip (after a successful save). */
  readonly markSaved: (ids: readonly string[]) => void;
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
  /** Replaces the repository/store in tests or when connecting the real backend. */
  readonly catalog?: CatalogRepository;
  readonly store?: PersistentStore<DiscoverState>;
}

/** Provides the editorial catalog and the discover state (stored locally) to the UI tree: a single source of truth for each kind of data. */
export function DiscoverProvider({ children, catalog, store }: DiscoverProviderProps) {
  const [defaultRepo] = useState(() => new HttpCatalogRepository(apiClient));
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
      markSaved: (ids) => kv.update((s) => S.markSaved(s, ids)),
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

/** Access to the editorial catalog, the state and the discover actions; throws if `DiscoverProvider` was forgotten. */
export function useDiscover(): DiscoverContextValue {
  const ctx = useContext(DiscoverContext);
  if (!ctx) throw new Error('useDiscover phải nằm trong DiscoverProvider');
  return ctx;
}
