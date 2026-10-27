import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { sessionTokenStore } from '../../../shared/state/sessionToken.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';
import { IdentityFlowHost } from '../components/IdentityFlowHost.tsx';
import { HttpIdentityGateway } from '../api/HttpIdentityGateway.ts';
import { NO_LOCKS, sanitizeLocks } from '../model/attemptLock.ts';
import type { LockState } from '../model/attemptLock.ts';
import { IDENTITY_COPY as C } from '../model/identity.copy.ts';
import type { SessionState } from '../model/identity.types.ts';
import type { Flow } from '../model/identityFlow.types.ts';
import { NO_SESSION, sanitizeSession } from '../model/identitySanitize.ts';
import { expiredBranch } from '../model/identitySnapshot.ts';
import { deviceLabel } from './deviceLabel.ts';
import { IdentityContext } from './identityContext.ts';
import type { IdentityValue } from './identityContext.ts';
import { createIdentityActions } from './useIdentityActions.ts';
import { useIdentitySnapshot } from './useIdentitySnapshot.ts';

/** Cấp danh tính ẩn danh thật (phiên Bearer + ảnh chụp từ API) và các luồng tờ phủ cho cây giao diện. */
export function IdentityProvider({ children }: { readonly children: ReactNode }) {
  const [sessionKv] = useState(() => new PersistentStore<SessionState>(STORAGE.SESSION, NO_SESSION, sanitizeSession));
  const [locksKv] = useState(() => new PersistentStore<LockState>(STORAGE.LOCKS, NO_LOCKS, sanitizeLocks));
  const [gateway] = useState(() => new HttpIdentityGateway(apiClient, deviceLabel()));
  const toast = useToast();
  const session = useStore(sessionKv);
  const locks = useStore(locksKv);
  const { token } = useStore(sessionTokenStore);
  const [flow, setFlow] = useState<Flow | null>(null);
  const { status, snapshot, refresh } = useIdentitySnapshot(gateway, sessionKv, token);

  const actions = useMemo(
    () => createIdentityActions({ gateway, sessionKv, locksKv, deviceName: deviceLabel, refresh }),
    [gateway, sessionKv, locksKv, refresh],
  );
  const closeFlow = useCallback(() => setFlow(null), []);
  // "mất phiên": máy chủ không nhận nữa, hoặc đã rời màn hết phiên nhưng vẫn nhớ từng có danh tính
  const lost = status === 'expired' || (status === 'anonymous' && session.known !== null);
  const requireIdentity = useCallback(
    (then: () => unknown) => {
      if (status === 'ready') then();
      else if (status === 'loading' || status === 'error') toast.show(C.intro.notReady);
      else if (lost && expiredBranch(session.known) === 'A') {
        // còn mã hoặc thiết bị khác: khôi phục được nên KHÔNG tạo danh tính mới đè lên
        toast.show(C.intro.needRecover);
        navigate(VIEW.RECOVER);
      } else setFlow({ kind: 'intro', onSaved: then, replacing: lost });
    },
    [status, lost, session.known, toast],
  );
  const value = useMemo<IdentityValue>(
    () => ({ status, identity: status === 'ready' ? snapshot : null, session, locks, actions, startFlow: setFlow, closeFlow, requireIdentity }),
    [status, snapshot, session, locks, actions, closeFlow, requireIdentity],
  );

  return (
    <IdentityContext.Provider value={value}>
      {children}
      {flow ? <IdentityFlowHost flow={flow} /> : null}
    </IdentityContext.Provider>
  );
}
