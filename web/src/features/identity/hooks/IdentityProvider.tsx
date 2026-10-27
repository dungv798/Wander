import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { NO_LOCKS, sanitizeLocks } from '../model/attemptLock.ts';
import type { LockState } from '../model/attemptLock.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import { expiredBranch } from '../model/identityServer.ts';
import { IdentityFlowHost } from '../components/IdentityFlowHost.tsx';
import type { ServerState, SessionState } from '../model/identity.types.ts';
import type { Flow } from '../model/identityFlow.types.ts';
import { sanitizeServer, sanitizeSession } from '../model/identitySanitize.ts';
import * as S from '../model/identityServer.ts';
import { NO_SESSION, createIdentityActions } from './useIdentityActions.ts';
import { IdentityContext } from './identityContext.ts';
import type { IdentityValue } from './identityContext.ts';

/** Cấp danh tính ẩn danh (máy chủ giả + phiên của máy này) và các luồng tờ phủ cho cây giao diện. */
export function IdentityProvider({ children }: { readonly children: ReactNode }) {
  const [serverKv] = useState(() => new PersistentStore<ServerState>(STORAGE.SERVER, S.INITIAL_SERVER, sanitizeServer));
  const [sessionKv] = useState(() => new PersistentStore<SessionState>(STORAGE.SESSION, NO_SESSION, sanitizeSession));
  const [locksKv] = useState(() => new PersistentStore<LockState>(STORAGE.LOCKS, NO_LOCKS, sanitizeLocks));
  const toast = useToast();
  const server = useStore(serverKv);
  const locks = useStore(locksKv);
  const session = useStore(sessionKv);
  const [flow, setFlow] = useState<Flow | null>(null);

  const actions = useMemo(() => createIdentityActions(serverKv, sessionKv, locksKv), [serverKv, sessionKv, locksKv]);

  const identity = server.identity && server.identity.devices.some((d) => d.id === session.deviceId) ? server.identity : null;
  const closeFlow = useCallback(() => setFlow(null), []);
  const requireIdentity = useCallback(
    (then: () => void) => {
      if (identity) then();
      else if (server.identity && expiredBranch(server) === 'A') {
        // còn mã hoặc thiết bị khác: khôi phục được nên KHÔNG tạo danh tính mới đè lên
        toast.show(C.intro.needRecover);
        navigate(VIEW.RECOVER);
      } else setFlow({ kind: 'intro', onSaved: then, replacing: Boolean(server.identity) });
    },
    [identity, server, toast],
  );
  const value = useMemo<IdentityValue>(
    () => ({ server, session, locks, identity, actions, startFlow: setFlow, closeFlow, requireIdentity }),
    [server, session, locks, identity, actions, closeFlow, requireIdentity],
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
      {flow ? <IdentityFlowHost flow={flow} /> : null}
    </IdentityContext.Provider>
  );
}
