import { randomId } from '../../../shared/lib/randomId.ts';
import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { clearFailures, recordFailure } from '../model/attemptLock.ts';
import type { LockState } from '../model/attemptLock.ts';
import type { ServerState, SessionState } from '../model/identity.types.ts';
import * as S from '../model/identityServer.ts';
import { deviceLabel } from './deviceLabel.ts';
import type { IdentityActions } from './identityContext.ts';

/** Phiên của một máy chưa có danh tính. */
export const NO_SESSION: SessionState = { deviceId: null, recovered: false };

/** Dựng các thao tác danh tính trên ba kho (máy chủ giả, phiên máy này, đếm lần sai). Mỗi thao tác gọi một hàm thuần ở `identityServer.ts`/`attemptLock.ts`. */
export function createIdentityActions(serverKv: PersistentStore<ServerState>, sessionKv: PersistentStore<SessionState>, locksKv: PersistentStore<LockState>): IdentityActions {
  /** Cập nhật máy chủ giả, kèm giờ hiện tại. */
  const upd = (change: (s: ServerState, now: number) => ServerState): void => serverKv.update((s) => change(s, Date.now()));
  return {
    createHere: () => {
      if (S.expiredBranch(serverKv.getSnapshot()) === 'A') return; // còn đường khôi phục: không ghi đè danh tính đang có
      const id = randomId();
      upd((s, now) => S.createIdentity(s, id, deviceLabel(), now));
      sessionKv.update(() => ({ deviceId: id, recovered: false }));
    },
    commitCode: (code) => upd((s, now) => S.commitCode(s, code, now)),
    revoke: (deviceId) => upd((s, now) => S.revokeDevice(s, deviceId, now)),
    markSeen: () => upd((s) => S.markSeen(s)),
    requestPairing: () => {
      const r = S.requestPairing(serverKv.getSnapshot(), deviceLabel(), Date.now());
      serverKv.update(() => r.state);
      return r.ok ? r.pairing : null;
    },
    decidePairing: (status) => upd((s) => S.decidePairing(s, status)),
    answerPairing: (choice) => {
      const r = S.answerPairing(serverKv.getSnapshot(), choice, Date.now());
      serverKv.update(() => r.state);
      return r.outcome;
    },
    clearPairing: () => upd((s) => S.clearPairing(s)),
    joinHere: (via) => {
      const live = serverKv.getSnapshot().identity;
      if (live?.devices.some((d) => d.id === sessionKv.getSnapshot().deviceId)) return; // đã là thiết bị tin cậy: không thêm lần hai
      if (!live) return;
      const id = randomId();
      upd((s, now) => S.addDevice(S.clearPairing(s), { id, name: deviceLabel(), at: now }, via, now));
      sessionKv.update(() => ({ deviceId: id, recovered: true }));
    },
    fail: (scope) => locksKv.update((s) => recordFailure(s, scope, Date.now())),
    clearFails: (scope) => locksKv.update((s) => clearFailures(s, scope)),
    touch: () => {
      const id = sessionKv.getSnapshot().deviceId;
      if (id) upd((s, now) => S.touchDevice(s, id, now));
    },
    ackRecovered: () => sessionKv.update((s) => (s.recovered ? { ...s, recovered: false } : s)),
    renameHere: (name) => {
      const id = sessionKv.getSnapshot().deviceId;
      if (id) upd((s, now) => S.renameDevice(s, id, name, now));
    },
    expireHere: () => {
      const id = sessionKv.getSnapshot().deviceId;
      if (id) upd((s, now) => S.revokeDevice(s, id, now));
    },
    loseSession: () => sessionKv.update(() => NO_SESSION),
    addDemoDevice: (name) => upd((s, now) => S.addDevice(s, { id: randomId(), name, at: now }, 'paired', now)),
  };
}
