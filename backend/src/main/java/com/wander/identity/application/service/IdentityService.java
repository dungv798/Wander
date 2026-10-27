package com.wander.identity.application.service;

import com.wander.identity.application.view.IdentityViews.CodeStatus;
import com.wander.identity.application.view.IdentityViews.CreatedIdentity;
import com.wander.identity.application.view.IdentityViews.SessionView;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.rule.Secrets;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
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

    /** Nhận cổng lưu trữ và đồng hồ (test thay bằng đồng hồ giả). */
    public IdentityService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    /**
     * Tạo danh tính + phiên đầu tiên. D26: mã khôi phục hiển thị một lần ngay lúc tạo; người dùng được phép bỏ qua
     * (khi đó chưa có mã, tạo sau ở mục Bảo mật — MĐ-2).
     */
    public CreatedIdentity createIdentity(boolean skipRecoveryCode) {
        Instant now = Timestamps.now(clock);
        UUID identityId = UUID.randomUUID();
        String token = Secrets.newSessionToken();
        store.addIdentity(new Identity(identityId, now));
        store.addSession(Session.open(identityId, Secrets.hashToken(token), now));
        String displayedCode = null;
        if (!skipRecoveryCode) {
            displayedCode = Secrets.newRecoveryCode();
            store.addRecoveryCode(RecoveryCode.issue(identityId, Secrets.hashDisplayedRecoveryCode(displayedCode), now));
        }
        return new CreatedIdentity(identityId.toString(), token, displayedCode);
    }

    /** Kiểm tra phiên ở mỗi yêu cầu: phiên đã thu hồi mất quyền ngay ở yêu cầu kế tiếp (INV-2). */
    public Optional<AuthenticatedPrincipal> authenticateSession(String token) {
        Optional<Session> session = store.findSessionByTokenHash(Secrets.hashToken(token)).filter(Session::isActive);
        session.ifPresent(found -> store.touchSession(found.id(), Timestamps.now(clock)));
        return session.map(found -> new AuthenticatedPrincipal(found.identityId(), found.id()));
    }

    /** Các phiên đang hoạt động của danh tính, đánh dấu phiên hiện tại. */
    @Transactional(readOnly = true)
    public List<SessionView> listActiveSessions(AuthenticatedPrincipal principal) {
        return store.activeSessions(principal.identityId()).stream()
                .map(session -> new SessionView(session.id().toString(), Timestamps.format(session.createdAt()),
                        Timestamps.format(session.lastSeenAt()), session.id().equals(principal.sessionId())))
                .toList();
    }

    /** Thu hồi một phiên của chính danh tính này (không cần xác thực lại: không thuộc D25). */
    public void revokeSession(AuthenticatedPrincipal principal, String sessionId) {
        UUID id = Ids.parse(sessionId).orElseThrow(WanderException::notFound);
        store.findActiveSession(id, principal.identityId()).orElseThrow(WanderException::notFound);
        store.revokeSession(id, Timestamps.now(clock));
    }

    /** Danh tính đã có mã khôi phục hợp lệ chưa, và mã được tạo lúc nào. */
    @Transactional(readOnly = true)
    public CodeStatus getRecoveryCodeStatus(UUID identityId) {
        return store.findActiveCode(identityId)
                .map(code -> new CodeStatus(true, Timestamps.format(code.createdAt())))
                .orElse(new CodeStatus(false, null));
    }
}
