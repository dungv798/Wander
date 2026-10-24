package com.wander.identity.application;

import com.wander.identity.application.IdentityViews.CodeStatus;
import com.wander.identity.application.IdentityViews.CreatedIdentity;
import com.wander.identity.application.IdentityViews.SessionView;
import com.wander.identity.domain.IdentityModel.Identity;
import com.wander.identity.domain.IdentityModel.RecoveryCode;
import com.wander.identity.domain.IdentityModel.Session;
import com.wander.identity.domain.IdentityStore;
import com.wander.identity.domain.Secrets;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.kernel.Ids;
import com.wander.shared.kernel.Timestamps;
import com.wander.shared.kernel.WanderException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Danh tính ẩn danh và phiên (D15). Phần khôi phục ở {@link RecoveryService}. */
@Service
@Transactional
public class IdentityService {

    private final IdentityStore store;
    private final Clock clock;

    public IdentityService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /**
     * Tạo danh tính + phiên đầu tiên. D26: mã khôi phục hiển thị một lần ngay lúc tạo; người dùng được phép bỏ qua
     * (khi đó chưa có mã, tạo sau ở mục Bảo mật — MĐ-2).
     */
    public CreatedIdentity create(boolean skipRecoveryCode) {
        Instant now = now();
        UUID identityId = UUID.randomUUID();
        String token = Secrets.newSessionToken();
        store.addIdentity(new Identity(identityId, now));
        store.addSession(Session.open(identityId, Secrets.hashToken(token), now));
        String code = null;
        if (!skipRecoveryCode) {
            code = Secrets.newRecoveryCode();
            store.addRecoveryCode(RecoveryCode.issue(identityId,
                    Secrets.hashRecoveryCode(Secrets.normalize(code, Secrets.RECOVERY_CODE_SYMBOLS)), now));
        }
        return new CreatedIdentity(identityId.toString(), token, code);
    }

    /** Kiểm tra phiên ở mỗi yêu cầu: phiên đã thu hồi mất quyền ngay ở yêu cầu kế tiếp (INV-2). */
    public Optional<AuthenticatedPrincipal> authenticate(String token) {
        Optional<Session> s = store.findSessionByTokenHash(Secrets.hashToken(token)).filter(Session::isActive);
        s.ifPresent(x -> store.touchSession(x.id(), now()));
        return s.map(x -> new AuthenticatedPrincipal(x.identityId(), x.id()));
    }

    @Transactional(readOnly = true)
    public List<SessionView> sessions(AuthenticatedPrincipal p) {
        return store.activeSessions(p.identityId()).stream()
                .map(s -> new SessionView(s.id().toString(), Timestamps.format(s.createdAt()),
                        Timestamps.format(s.lastSeenAt()), s.id().equals(p.sessionId())))
                .toList();
    }

    /** Thu hồi một phiên của chính danh tính này (không cần xác thực lại: không thuộc D25). */
    public void revokeSession(AuthenticatedPrincipal p, String sessionId) {
        UUID id = Ids.parse(sessionId).orElseThrow(WanderException::notFound);
        store.findActiveSession(id, p.identityId()).orElseThrow(WanderException::notFound);
        store.revokeSession(id, now());
    }

    @Transactional(readOnly = true)
    public CodeStatus codeStatus(UUID identityId) {
        return store.findActiveCode(identityId)
                .map(c -> new CodeStatus(true, Timestamps.format(c.createdAt())))
                .orElse(new CodeStatus(false, null));
    }

    private Instant now() {
        return Timestamps.truncate(clock.instant());
    }
}
