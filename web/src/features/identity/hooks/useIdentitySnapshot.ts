import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { LatestOnly } from '../../../shared/lib/LatestOnly.ts';
import { currentToken } from '../../../shared/state/sessionToken.ts';
import type { PersistentStore } from '../../../shared/state/PersistentStore.ts';
import type { IdentityGateway } from '../api/IdentityGateway.ts';
import { IDENTITY_API } from '../api/identityApi.const.ts';
import type { IdentitySnapshot, IdentityStatus, SessionState } from '../model/identity.types.ts';

/** Trạng thái nạp danh tính: tình trạng và ảnh chụp mới nhất từ máy chủ. */
interface Loaded {
  readonly status: IdentityStatus;
  readonly snapshot: IdentitySnapshot | null;
  /** Bí mật phiên mà kết quả này thuộc về: đổi bí mật (tạo/khôi phục/ghép/quên) thì kết quả cũ không còn đúng cho máy này. */
  readonly token: string | null;
}

/** Kết quả của hook: trạng thái hiện tại, ảnh chụp (chỉ khi `ready`) và hàm nạp lại. */
export interface SnapshotState {
  readonly status: IdentityStatus;
  readonly snapshot: IdentitySnapshot | null;
  readonly refresh: () => Promise<void>;
}

/** Ghi lại điều đã biết về danh tính (có mã không, bao nhiêu thiết bị) để màn hết phiên chọn nhánh; không đổi thì giữ nguyên. */
function rememberKnown(snapshot: IdentitySnapshot, prev: SessionState): SessionState {
  const known = { hasCode: snapshot.hasCode, deviceCount: snapshot.devices.length };
  return prev.known?.hasCode === known.hasCode && prev.known.deviceCount === known.deviceCount ? prev : { ...prev, known };
}

/**
 * Nạp ảnh chụp danh tính của máy này từ máy chủ mỗi khi bí mật phiên (`token`) đổi, và khi gọi `refresh`. Kết quả của lần gọi cũ hơn
 * lần mới nhất bị bỏ (tránh đua). 401 là hết phiên; lỗi khác giữ ảnh cũ, hoặc `error` nếu chưa có ảnh (KHÔNG coi là chưa có danh tính).
 */
export function useIdentitySnapshot(gateway: IdentityGateway, sessionKv: PersistentStore<SessionState>, token: string | null): SnapshotState {
  const [loaded, setLoaded] = useState<Loaded>(() => ({ status: currentToken() ? 'loading' : 'anonymous', snapshot: null, token: currentToken() }));
  const [guard] = useState(() => new LatestOnly());

  /** Hỏi máy chủ và trả cách cập nhật trạng thái: ảnh chụp mới, hết phiên (401), hoặc giữ ảnh cũ khi lỗi khác. */
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
  // bí mật vừa đổi (tạo/khôi phục/ghép) mà kết quả của bí mật mới chưa về: đang nạp, KHÔNG dùng lại kết quả của bí mật cũ
  if (loaded.token !== token) return { status: 'loading', snapshot: null, refresh };
  return { status: loaded.status, snapshot: loaded.snapshot, refresh };
}
