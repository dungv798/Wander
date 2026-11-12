import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { useIdentity } from '../../identity/index.ts';
import { HttpTripsGateway } from '../api/HttpTripsGateway.ts';
import type { TripsGateway } from '../api/TripsGateway.ts';
import type { Trip, TripsState } from '../model/trip.types.ts';
import { mergeLoaded } from '../model/tripOrder.ts';
import { INITIAL_TRIPS_STATE } from '../model/tripState.ts';
import { clearTripsCache, loadTripsCache, saveTripsCache } from '../model/tripsCache.ts';
import { createTripsActions } from './tripsActions.ts';
import type { TripsActions } from './tripsActions.ts';

export type { TripsActions };

/** The loading state of the trip list: `loading` (the first load), `ready` (loaded, or no identity yet so no trips), `error` (could not load). */
export type TripsStatus = 'loading' | 'ready' | 'error';

interface TripsContextValue {
  readonly status: TripsStatus;
  readonly state: TripsState;
  readonly actions: TripsActions;
  /** A trip by id; undefined if there is none. */
  readonly trip: (id: string | null) => Trip | undefined;
  /** Milliseconds since the epoch of the read-only copy being shown when the server does not answer; null when the data is the latest copy from the server (B-09). */
  readonly staleSince: number | null;
  /** Reloads every trip from the server (the 'Retry' button). */
  readonly reload: () => void;
}

const TripsContext = createContext<TripsContextValue | null>(null);

/** The internal key of the in-memory store (it is not written to localStorage). */
const TRIPS_STORE_KEY = 'trips.server';

/** The result of loading the list: `idle` not loaded, `ok`, `failed`; tied to `round` to drop the result of an old load. `staleAt`: when loading fails and a read-only copy exists it is the time that copy was saved. */
interface LoadState {
  readonly round: number;
  readonly result: 'idle' | 'ok' | 'failed';
  readonly staleAt: number | null;
}

/**
 * Provides the trip store to the UI tree. The SERVER is the source of truth: the in-memory store is only a re-read copy, loaded when the identity is ready and after every
 * action. It must be inside `IdentityProvider`. With no identity (or an ended session) there is no trip.
 */
export function TripsProvider({ children, gateway }: { readonly children: ReactNode; readonly gateway?: TripsGateway }) {
  const [store] = useState(() => new PersistentStore<TripsState>(TRIPS_STORE_KEY, INITIAL_TRIPS_STATE, () => null, null));
  const [defaultGateway] = useState<TripsGateway>(() => new HttpTripsGateway(apiClient));
  const api = gateway ?? defaultGateway;
  const state = useStore(store);
  const { status: identityStatus, actions: identityActions } = useIdentity();
  const [round, setRound] = useState(0);
  const [load, setLoad] = useState<LoadState>({ round: -1, result: 'idle', staleAt: null });
  const ready = identityStatus === 'ready';
  // the identity goes in/out of the ready state (session ended, recovery, device pairing): the old load result is no longer right, reload
  const [prevReady, setPrevReady] = useState(ready);
  if (prevReady !== ready) {
    setPrevReady(ready);
    setRound((r) => r + 1);
  }

  useEffect(() => {
    if (!ready) {
      // the session cannot be checked because the server does not answer: show the read-only copy if there is one (the label is in `staleSince`), otherwise the screen is empty as before
      const kept = identityStatus === 'error' ? loadTripsCache() : null;
      store.update(() => (kept ? { trips: kept.trips } : INITIAL_TRIPS_STATE));
      // clear only when it is certain there is no session (no identity, session ended): while the session is being checked on page open ('loading') or the check failed ('error') keep the read-only copy
      if (identityStatus === 'anonymous' || identityStatus === 'expired') clearTripsCache(); // the trips of the old identity must not show again
      return undefined;
    }
    let live = true;
    const started = store.getSnapshot();
    api.loadAll().then((trips) => {
      if (!live) return;
      // a write action interleaved with the load: a trip that has been re-read afterward keeps the newer copy, a newly created trip is not lost
      store.update((cur) => ({ trips: mergeLoaded(started, cur, trips) }));
      setLoad({ round, result: 'ok', staleAt: null });
    }).catch(() => {
      if (!live) return;
      // the server does not answer: if a read-only copy of the earlier successful load exists show it (with a label), do not leave the screen empty
      const cached = loadTripsCache();
      if (cached) store.update(() => ({ trips: cached.trips }));
      setLoad({ round, result: 'failed', staleAt: cached ? cached.savedAt : null });
    });
    return () => {
      live = false;
    };
  }, [ready, identityStatus, api, store, round]);

  // the read-only copy is always the most recent successful load; do not write while an old copy is being shown (otherwise the 'saved at' mark would be falsely refreshed)
  const fresh = ready && load.round === round && load.result === 'ok';
  useEffect(() => {
    if (fresh) saveTripsCache(state.trips, Date.now());
  }, [fresh, state.trips]);

  const actions = useMemo(() => createTripsActions({ gateway: api, store }), [api, store]);
  const reload = useCallback(() => {
    if (identityStatus === 'error') void identityActions.refresh(); // the session check did not pass: ask the identity again first
    setRound((r) => r + 1);
  }, [identityStatus, identityActions]);
  const settled = ready && load.round === round;
  const identityStale = useMemo(() => (identityStatus === 'error' ? loadTripsCache()?.savedAt ?? null : null), [identityStatus]);
  const staleSince = identityStale ?? (settled && load.result === 'failed' ? load.staleAt : null);
  const status: TripsStatus = identityStatus === 'error' ? (identityStale === null ? 'error' : 'ready') : identityStatus === 'loading' ? 'loading' : !ready ? 'ready' : load.round !== round ? 'loading' : load.result === 'failed' && staleSince === null ? 'error' : 'ready';
  const value = useMemo<TripsContextValue>(() => ({ status, state, actions, trip: (id) => state.trips.find((t) => t.id === id), staleSince, reload }), [status, state, actions, staleSince, reload]);
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}

/** Access to the trip store; throws if `TripsProvider` was forgotten. */
export function useTrips(): TripsContextValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips phải nằm trong TripsProvider');
  return ctx;
}
