package com.wander.identity.application.service;

import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.view.IdentityViews.CodeStatus;
import com.wander.identity.application.view.IdentityViews.CreatedIdentity;
import com.wander.identity.application.view.IdentityViews.SessionView;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.port.RecoveryCodeHasher;
import com.wander.identity.domain.rule.Secrets;
import com.wander.identity.domain.vocabulary.EventKind;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Patch;
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
    private final RecoveryCodeHasher hasher;
    private final SecurityEventService events;

    /** Nhận cổng lưu trữ, đồng hồ (test thay bằng đồng hồ giả), bộ băm mã khôi phục có khóa và nhật ký sự kiện bảo mật. */
    public IdentityService(IdentityStore store, Clock clock, RecoveryCodeHasher hasher, SecurityEventService events) {
        this.store = store;
        this.clock = clock;
        this.hasher = hasher;
        this.events = events;
    }

    /**
     * Tạo danh tính + phiên đầu tiên. D26: mã khôi phục hiển thị một lần ngay lúc tạo; người dùng được phép bỏ qua
     * (khi đó chưa có mã, tạo sau ở mục Bảo mật — MĐ-2).
     */
    public CreatedIdentity createIdentity(boolean skipRecoveryCode, String deviceName) {
        Instant now = Timestamps.now(clock);
        UUID identityId = UUID.randomUUID();
        String token = Secrets.newSessionToken();
        store.addIdentity(new Identity(identityId, now));
        store.addSession(Session.open(identityId, Secrets.hashToken(token), deviceName, now));
        events.record(identityId, EventKind.CREATED, deviceName);
        String displayedCode = null;
        if (!skipRecoveryCode) {
            displayedCode = Secrets.newRecoveryCode();
            store.addRecoveryCode(RecoveryCode.issue(identityId, hasher.hashDisplayed(displayedCode), now, hasher.currentKeyVersion()));
            events.record(identityId, EventKind.CODE, null);
        }
        return new CreatedIdentity(identityId.toString(), token, displayedCode);
    }

    /** Kiểm tra hạn và thu hồi trước khi gia hạn trượt; mọi phiên không hợp lệ đều mất quyền như nhau. */
    public Optional<AuthenticatedPrincipal> authenticateSession(String token) {
        Instant now = Timestamps.now(clock);
        Optional<Session> session = store.findSessionByTokenHash(Secrets.hashToken(token)).filter(found -> found.isActive(now, () -> store.findActiveCode(found.identityId()).isPresent()));
        session.filter(found -> found.needsTouch(now)).ifPresent(found -> store.touchSession(found.id(), now));
        return session.map(found -> new AuthenticatedPrincipal(found.identityId(), found.id()));
    }

    /** Các phiên đang hoạt động của danh tính, đánh dấu phiên hiện tại. */
    @Transactional(readOnly = true)
    public List<SessionView> listActiveSessions(AuthenticatedPrincipal principal) {
        Instant now = Timestamps.now(clock);
        return store.activeSessions(principal.identityId()).stream()
                .filter(session -> session.isActive(now, () -> store.findActiveCode(principal.identityId()).isPresent()))
                .map(session -> new SessionView(session.id().toString(), Timestamps.format(session.createdAt()),
                        Timestamps.format(session.lastSeenAt()), session.id().equals(principal.sessionId()), session.deviceName()))
                .toList();
    }

    /**
     * Đổi hoặc xóa tên của CHÍNH thiết bị đang gọi (không đổi được tên máy khác). Phải nêu trường {@code deviceName}; giá trị
     * null hoặc trống = xóa tên. Trả về phiên sau khi đổi.
     */
    public SessionView renameCurrentDevice(AuthenticatedPrincipal principal, Patch<String> newName) {
        if (!newName.isPresent()) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, IdentityMessages.DEVICE_NAME_REQUIRED, IdentityFields.DEVICE_NAME);
        }
        String deviceName = IdentityInput.deviceName(newName.value());
        Session session = store.findActiveSession(principal.sessionId(), principal.identityId()).orElseThrow(WanderException::notFound);
        store.renameSession(session.id(), deviceName);
        return new SessionView(session.id().toString(), Timestamps.format(session.createdAt()),
                Timestamps.format(session.lastSeenAt()), true, deviceName);
    }

    /** Thu hồi một phiên của chính danh tính này (không cần xác thực lại: không thuộc D25). */
    public void revokeSession(AuthenticatedPrincipal principal, String sessionId) {
        UUID id = Ids.parse(sessionId).orElseThrow(WanderException::notFound);
        Session revoked = store.findActiveSession(id, principal.identityId()).orElseThrow(WanderException::notFound);
        store.revokeSession(id, Timestamps.now(clock));
        events.record(principal.identityId(), EventKind.REVOKED, revoked.deviceName());
    }

    /** Thu hồi mọi phiên khác của cùng danh tính, kể cả phiên đã hết hạn; giữ nguyên phiên đang gọi. */
    public void revokeOtherSessions(AuthenticatedPrincipal principal) {
        Instant now = Timestamps.now(clock);
        for (Session session : store.activeSessions(principal.identityId())) {
            if (!session.id().equals(principal.sessionId())) {
                store.revokeSession(session.id(), now);
                events.record(principal.identityId(), EventKind.REVOKED, session.deviceName());
            }
        }
    }

    /** Danh tính đã có mã khôi phục hợp lệ chưa, và mã được tạo lúc nào. */
    @Transactional(readOnly = true)
    public CodeStatus getRecoveryCodeStatus(UUID identityId) {
        return store.findActiveCode(identityId)
                .map(code -> new CodeStatus(true, Timestamps.format(code.createdAt())))
                .orElse(new CodeStatus(false, null));
    }
}
