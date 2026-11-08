import { ApiError } from '../../../shared/api/ApiError.ts';
import { newAttemptId, newSessionToken } from '../../../shared/lib/randomToken.ts';
import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import { clearToken, currentToken, setToken } from '../../../shared/state/sessionToken.ts';
import type { IdentityGateway } from '../api/IdentityGateway.ts';
import { clearFailures, recordFailure } from '../model/attemptLock.ts';
import type { LockState } from '../model/attemptLock.ts';
import type { PairingRequest, SessionState } from '../model/identity.types.ts';
import type { IdentityActions, RecoveryAttempt } from './identityContext.ts';

/** Mã lỗi khi vượt hạn mức yêu cầu (backend trả 429 `RATE_LIMITED`). */
const RATE_LIMITED = 'RATE_LIMITED';
/** Mã lỗi khi phiên không còn được máy chủ nhận. */
const UNAUTHENTICATED = 'UNAUTHENTICATED';
/** Dấu gạch của mã ghép hiển thị `XXXX-XXXX`. */
const DASH = /-/g;

/** Những thứ thao tác danh tính cần: cổng API, hai kho cục bộ (cờ phiên, đếm lần sai), tên máy này và hàm nạp lại ảnh chụp. */
export interface IdentityActionDeps {
  readonly gateway: IdentityGateway;
  readonly sessionKv: PersistentStore<SessionState>;
  readonly locksKv: PersistentStore<LockState>;
  /** Tên gợi nhớ của máy này ("Điện thoại"/"Máy tính"), gửi lên khi tạo danh tính, ghép hoặc khôi phục. */
  readonly deviceName: () => string;
  readonly refresh: () => Promise<void>;
}

type Group<K extends keyof IdentityActions> = Pick<IdentityActions, K>;

/** Thao tác khôi phục trên máy chưa có phiên: bắt đầu bằng mã và hoàn tất (bí mật phiên do máy này tự sinh). */
function recoveryActions({ gateway, sessionKv, deviceName }: IdentityActionDeps): Group<'startRecovery' | 'completeRecovery'> {
  return {
    startRecovery: async (code) => {
      const sessionToken = newSessionToken();
      const started = await gateway.startRecovery(code, newAttemptId(), sessionToken, deviceName());
      return { ...started, sessionToken };
    },
    completeRecovery: async (attempt: RecoveryAttempt) => {
      await gateway.completeRecovery(attempt.attemptId, attempt.code);
      sessionKv.update((s) => ({ ...s, recovered: true }));
      setToken(attempt.sessionToken);
    },
  };
}

/** Thao tác ghép thiết bị từ máy mới: xin ghép, hỏi trạng thái và nhận phiên khi được duyệt. */
function pairingActions({ gateway, sessionKv, deviceName }: IdentityActionDeps): Group<'requestPairing' | 'pairingStatus' | 'joinHere'> {
  return {
    requestPairing: async (): Promise<PairingRequest | null> => {
      const sessionToken = newSessionToken();
      const name = deviceName();
      try {
        const link = await gateway.createLink(sessionToken, name);
        return {
          requestId: link.requestId,
          code: link.pairingCode.replace(DASH, ''),
          number: link.number,
          name,
          at: Date.now(),
          expiresAt: link.expiresAt,
          sessionToken,
        };
      } catch (e) {
        if (e instanceof ApiError && e.code === RATE_LIMITED) return null;
        throw e;
      }
    },
    pairingStatus: (request, signal) => gateway.linkStatus(request.requestId, signal),
    joinHere: async (request) => {
      sessionKv.update((s) => ({ ...s, recovered: true }));
      setToken(request.sessionToken);
    },
  };
}

/**
 * Dựng các thao tác danh tính trên API thật. Thao tác đổi bí mật phiên (tạo, khôi phục, ghép) chỉ ghi bí mật vào kho dùng chung:
 * Provider tự nạp lại ảnh chụp khi bí mật đổi. Thao tác đổi dữ liệu trên máy chủ thì gọi `refresh` ngay.
 */
export function createIdentityActions(deps: IdentityActionDeps): IdentityActions {
  const { gateway, sessionKv, locksKv, deviceName, refresh } = deps;
  /** Chạy một thao tác cần phiên; máy chủ trả 401 (phiên đã bị thu hồi) thì nạp lại để giao diện sang "hết phiên" thay vì chỉ báo lỗi. */
  const guarded = async <T,>(run: () => Promise<T>): Promise<T> => {
    try {
      return await run();
    } catch (e) {
      if (e instanceof ApiError && e.code === UNAUTHENTICATED) void refresh();
      throw e;
    }
  };
  return {
    ensureIdentity: async () => {
      if (currentToken()) return;
      setToken(await gateway.createIdentity(deviceName()));
    },
    beginReplacement: (evidence) => guarded(() => gateway.beginReplacement(evidence)),
    confirmReplacement: (pendingId, code) => guarded(async () => {
      await gateway.confirmReplacement(pendingId, code);
      await refresh();
    }),
    requestStepUp: () => guarded(() => gateway.requestStepUp()),
    revoke: (deviceId) => guarded(async () => {
      await gateway.revoke(deviceId);
      await refresh();
    }),
    markSeen: () => guarded(async () => {
      await gateway.markSeen();
      await refresh();
    }),
    renameHere: (name) => guarded(async () => {
      await gateway.rename(name);
      await refresh();
    }),
    ...recoveryActions(deps),
    ...pairingActions(deps),
    preview: (code) => guarded(() => gateway.preview(code)),
    answer: (preview, number) => guarded(() => gateway.answer(preview, number)),
    deny: (preview) => guarded(() => gateway.deny(preview)),
    fail: (scope) => locksKv.update((s) => recordFailure(s, scope, Date.now())),
    clearFails: (scope) => locksKv.update((s) => clearFailures(s, scope)),
    ackRecovered: () => sessionKv.update((s) => (s.recovered ? { ...s, recovered: false } : s)),
    loseSession: () => {
      clearToken();
      // vẫn nhớ "từng có danh tính" (nhánh A/B) để lần lưu sau không lặng lẽ tạo danh tính mới đè lên chuyến cũ
      sessionKv.update((s) => (s.recovered ? { ...s, recovered: false } : s));
    },
    refresh,
  };
}
