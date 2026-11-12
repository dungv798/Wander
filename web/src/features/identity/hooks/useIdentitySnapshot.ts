import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { LatestOnly } from '../../../shared/lib/LatestOnly.ts';
import { currentToken } from '../../../shared/state/sessionToken.ts';
import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { IdentityGateway } from '../api/IdentityGateway.ts';
import { IDENTITY_API } from '../api/identityApi.const.ts';
import type { IdentitySnapshot, IdentityStatus, SessionState } from '../model/identity.types.ts';

/** The identity loading state: the status and the latest snapshot from the server. */
interface Loaded {
  readonly status: IdentityStatus;
  readonly snapshot: IdentitySnapshot | null;
  /** The session secret this result belongs to: when the secret changes (create/recover/pair/forget) the old result is no longer right for this device. */
  readonly token: string | null;
}

/** The hook's result: the current state, the snapshot (only when `ready`) and the reload function. */
export interface SnapshotState {
  readonly status: IdentityStatus;
  readonly snapshot: IdentitySnapshot | null;
  readonly refresh: () => Promise<void>;
}

/** Records what is known about the identity (whether it has a code, how many devices) so the session-ended screen can pick a branch; unchanged keeps it as is. */
function rememberKnown(snapshot: IdentitySnapshot, prev: SessionState): SessionState {
  const known = { hasCode: snapshot.hasCode, deviceCount: snapshot.devices.length };
  return prev.known?.hasCode === known.hasCode && prev.known.deviceCount === known.deviceCount ? prev : { ...prev, known };
}

/**
 * Loads this device's identity snapshot from the server every time the session secret (`token`) changes, and when `refresh` is called. The result of a call older than
 * the latest one is dropped (avoiding a race). 401 means the session ended; any other error keeps the old snapshot, or `error` if there is none (NOT treated as having no identity).
 */
export function useIdentitySnapshot(gateway: IdentityGateway, sessionKv: PersistentStore<SessionState>, token: string | null): SnapshotState {
  const [loaded, setLoaded] = useState<Loaded>(() => ({ status: currentToken() ? 'loading' : 'anonymous', snapshot: null, token: currentToken() }));
  const [guard] = useState(() => new LatestOnly());

  /** Asks the server and returns how to update the state: a new snapshot, session ended (401), or keep the old snapshot on another error. */
  const fetchState = useCallback(async (): Promise<(cur: Loaded) => Loaded> => {
    const used = currentToken();
    try {
      const snapshot = await gateway.snapshot();
      sessionKv.update((s) => rememberKnown(snapshot, s));
      return () => ({ status: 'ready', snapshot, token: used });
    } catch (e) {
      if (e instanceof ApiError && e.code === IDENTITY_API.UNAUTHENTICATED) return () => ({ status: 'expired', snapshot: null, token: used });
      return (cur) => {
        const keep = cur.token === used ? cur.snapshot : null;
        return { status: keep ? 'ready' : 'error', snapshot: keep, token: used };
      };
    }
  }, [gateway, sessionKv]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!currentToken()) return;
    const ticket = guard.begin();
    const update = await fetchState();
    if (guard.isCurrent(ticket)) setLoaded(update);
  }, [fetchState, guard]);

  useEffect(() => {
    if (!token) return undefined;
    let live = true;
    const ticket = guard.begin();
    void fetchState().then((update) => {
      if (live && guard.isCurrent(ticket)) setLoaded(update);
    });
    return () => {
      live = false;
    };
  }, [token, fetchState, guard]);

  if (!token) return { status: 'anonymous', snapshot: null, refresh };
  // the secret just changed (create/recover/pair) and the result for the new secret has not arrived: loading, do NOT reuse the result of the old secret
  if (loaded.token !== token) return { status: 'loading', snapshot: null, refresh };
  return { status: loaded.status, snapshot: loaded.snapshot, refresh };
}
