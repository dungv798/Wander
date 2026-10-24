package com.wander.identity.application;

import com.wander.identity.application.IdentityViews.Approved;
import com.wander.identity.application.IdentityViews.Committed;
import com.wander.identity.application.IdentityViews.RecoveryStarted;
import com.wander.identity.application.IdentityViews.ReplacementBegun;
import com.wander.identity.application.IdentityViews.StepUpCreated;
import com.wander.identity.domain.IdentityModel.AttemptState;
import com.wander.identity.domain.IdentityModel.CodeReplacement;
import com.wander.identity.domain.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.IdentityModel.RecoveryCode;
import com.wander.identity.domain.IdentityModel.ReplacementState;
import com.wander.identity.domain.IdentityModel.Session;
import com.wander.identity.domain.IdentityModel.StepUpRequest;
import com.wander.identity.domain.IdentityModel.StepUpState;
import com.wander.identity.domain.IdentityStore;
import com.wander.identity.domain.Secrets;
import com.wander.shared.kernel.AuthenticatedPrincipal;
import com.wander.shared.kernel.Ids;
import com.wander.shared.kernel.Timestamps;
import com.wander.shared.kernel.WanderException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Khôi phục quyền chủ theo D20–D26 và bản thiết kế docs/autopilot/q16-design-draft.md.
 * <b>RELEASE GATE RG-1:</b> thiết kế chưa được Product Owner duyệt; không phát hành cho người dùng thật.
 * Các mặc định MĐ-1…MĐ-8 là PROPOSED; mã bám sát chúng và sẽ đổi theo kết quả duyệt.
 * <p>
 * Mỗi phương thức public là một giao dịch. Ném lỗi ⇒ rollback toàn bộ (kể cả việc đánh dấu hết hạn trước khi ném),
 * giống bản cài đặt cũ.
 */
@Service
@Transactional
public class RecoveryService {

    /** Hạn của lần thử khôi phục chờ và mã thay thế chưa xác nhận (MĐ-6). Giá trị cụ thể: chờ spec. */
    public static final Duration PENDING_TTL = Duration.ofMinutes(15);
    /** Hạn của yêu cầu ghép thiết bị và yêu cầu phê duyệt xác thực lại. */
    public static final Duration APPROVAL_TTL = Duration.ofMinutes(5);

    static final Set<String> STEP_UP_OPERATIONS = Set.of("regenerate_code");

    private final IdentityStore store;
    private final Clock clock;

    public RecoveryService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    // ---------- Khôi phục bằng mã (KP-C, D24) ----------

    /**
     * Bước 1–2: kiểm tra mã hiện hành, tạo lần thử chờ và phát hành mã thay thế (chưa hợp lệ).
     * Mã cũ CHƯA bị tiêu thụ; chưa có phiên nào được tạo (INV-15).
     */
    public RecoveryStarted start(Map<String, Object> in) {
        String attemptKey = attemptKey(in.get("attemptId"));
        String tokenHash = Secrets.hashToken(sessionToken(in.get("sessionToken")));
        String normalized = Secrets.normalize(in.get("code"), Secrets.RECOVERY_CODE_SYMBOLS);
        if (normalized == null) throw invalidCode();

        RecoveryCode old = store.findActiveCodeByHash(Secrets.hashRecoveryCode(normalized)).orElseThrow(RecoveryService::invalidCode);
        String replacement = Secrets.newRecoveryCode();
        String replacementHash = hashOf(replacement);
        Instant now = now();
        Instant expiresAt = now.plus(PENDING_TTL);

        Optional<RecoveryAttempt> existing = store.findAttemptForUpdate(attemptKey);
        if (existing.isPresent()) {
            RecoveryAttempt a = existing.get();
            // Cùng lần thử bắt đầu lại (MĐ-6): chỉ cho chính bên đã tạo (cùng mã, cùng bí mật phiên).
            if (a.state() != AttemptState.PENDING || !a.oldCodeId().equals(old.id()) || !a.sessionTokenHash().equals(tokenHash)) {
                throw invalidCode();
            }
            store.saveAttempt(a.restart(replacementHash, expiresAt));
            return new RecoveryStarted(attemptKey, replacement, Timestamps.format(expiresAt));
        }
        if (store.isTokenHashInUse(tokenHash)) throw tokenInUse();
        store.saveAttempt(new RecoveryAttempt(UUID.randomUUID(), attemptKey, old.identityId(), old.id(), replacementHash,
                tokenHash, AttemptState.PENDING, now, expiresAt));
        return new RecoveryStarted(attemptKey, replacement, Timestamps.format(expiresAt));
    }

    /**
     * Bước 3–4: chủ nhập lại mã thay thế, rồi commit nguyên tử: vô hiệu mã cũ + kích hoạt mã thay thế + tạo phiên (INV-11).
     * Không thu hồi phiên nào khác (D23, INV-10). Gọi lại sau commit với cùng lần thử là idempotent (INV-12).
     */
    public Committed complete(Map<String, Object> in) {
        String attemptKey = attemptKey(in.get("attemptId"));
        String norm = Secrets.normalize(in.get("replacementCode"), Secrets.RECOVERY_CODE_SYMBOLS);
        if (norm == null) throw invalidReplacement();
        String replacementHash = Secrets.hashRecoveryCode(norm);

        RecoveryAttempt a = store.findAttemptForUpdate(attemptKey).orElseThrow(RecoveryService::invalidCode);
        if (!a.replacementHash().equals(replacementHash)) throw invalidReplacement();
        if (a.state() == AttemptState.COMMITTED) return Committed.YES;
        if (a.state() != AttemptState.PENDING) throw invalidCode();
        Instant now = now();
        if (a.isExpired(now)) {
            throw WanderException.invalid("ATTEMPT_EXPIRED",
                    "Lần khôi phục đã hết hạn. Hãy bắt đầu lại; mã hiện tại của bạn vẫn dùng được.", null);
        }
        // Khóa dòng mã cũ: hai lần thử đồng thời cùng một mã ⇒ đúng một lần commit (INV-7).
        RecoveryCode old = store.findCodeForUpdate(a.oldCodeId()).filter(RecoveryCode::isActive).orElseThrow(() ->
                WanderException.conflict("CODE_ALREADY_USED", "Mã này đã được dùng ở một lần khôi phục khác."));
        store.invalidateRecoveryCode(old.invalidate("recovered", now));
        store.addRecoveryCode(RecoveryCode.issue(a.identityId(), a.replacementHash(), now));
        store.addSession(Session.open(a.identityId(), a.sessionTokenHash(), now));
        store.saveAttempt(a.withState(AttemptState.COMMITTED));
        return Committed.YES;
    }

    // ---------- Phát hành lần đầu và tái tạo mã từ một phiên hợp lệ (hai pha; D23, D25, MĐ-2) ----------

    /**
     * Pha 1: tạo mã thay thế chờ. Mã hiện hành (nếu có) vẫn hợp lệ đến khi pha 2 commit (INV-13).
     * Có mã hiện hành thì bắt buộc xác thực lại: trình mã hiện hành, hoặc phê duyệt từ thiết bị khác.
     */
    public ReplacementBegun beginReplacement(AuthenticatedPrincipal p, Map<String, Object> in) {
        Optional<RecoveryCode> current = store.findActiveCode(p.identityId());
        if (current.isPresent()) {
            WanderException denied = WanderException.forbidden("STEP_UP_REQUIRED", "Cần xác thực lại để tạo mã mới.");
            if (!(in.get("evidence") instanceof Map<?, ?> evidence)) throw denied;
            Object type = evidence.get("type");
            if ("code".equals(type)) {
                String n = Secrets.normalize(evidence.get("code"), Secrets.RECOVERY_CODE_SYMBOLS);
                if (n == null || !Secrets.hashRecoveryCode(n).equals(current.get().codeHash())) throw denied;
            } else if ("approval".equals(type)) {
                consumeStepUp(p, evidence.get("requestId"), "regenerate_code");
            } else {
                throw denied;
            }
        }
        // Tại mọi thời điểm chỉ có một mã thay thế chờ.
        store.voidPendingReplacements(p.identityId());
        String replacement = Secrets.newRecoveryCode();
        Instant now = now();
        Instant expiresAt = now.plus(PENDING_TTL);
        UUID id = UUID.randomUUID();
        store.saveReplacement(new CodeReplacement(id, p.identityId(), p.sessionId(), current.map(RecoveryCode::id).orElse(null),
                hashOf(replacement), ReplacementState.PENDING, now, expiresAt));
        return new ReplacementBegun(id.toString(), replacement, Timestamps.format(expiresAt));
    }

    /** Pha 2: chủ nhập lại mã thay thế; commit vô hiệu mã cũ và kích hoạt mã mới trong một giao dịch. */
    public Committed confirmReplacement(AuthenticatedPrincipal p, Map<String, Object> in) {
        String n = Secrets.normalize(in.get("replacementCode"), Secrets.RECOVERY_CODE_SYMBOLS);
        if (n == null || !(in.get("pendingId") instanceof String pendingId)) throw invalidReplacement();
        CodeReplacement r = Ids.parse(pendingId)
                .flatMap(id -> store.findPendingReplacement(id, p.identityId()))
                .orElseThrow(() -> WanderException.notFound("Không có mã thay thế đang chờ."));
        Instant now = now();
        if (r.isExpired(now)) {
            throw WanderException.invalid("ATTEMPT_EXPIRED", "Mã thay thế đã hết hạn. Hãy tạo lại; mã hiện tại vẫn dùng được.", null);
        }
        if (!r.replacementHash().equals(Secrets.hashRecoveryCode(n))) throw invalidReplacement();
        Optional<RecoveryCode> current = store.findActiveCode(p.identityId());
        UUID currentId = current.map(RecoveryCode::id).orElse(null);
        if (currentId == null ? r.oldCodeId() != null : !currentId.equals(r.oldCodeId())) {
            throw WanderException.conflict("CODE_CHANGED", "Mã khôi phục đã thay đổi trong lúc chờ. Hãy bắt đầu lại.");
        }
        current.ifPresent(c -> store.invalidateRecoveryCode(c.invalidate("replaced", now)));
        store.addRecoveryCode(RecoveryCode.issue(p.identityId(), r.replacementHash(), now));
        store.saveReplacement(r.withState(ReplacementState.COMMITTED));
        return Committed.YES;
    }

    // ---------- Xác thực lại bằng phê duyệt từ thiết bị tin cậy khác (D25, MĐ-1) ----------

    public StepUpCreated requestStepUp(AuthenticatedPrincipal p, Map<String, Object> in) {
        if (!(in.get("operation") instanceof String op) || !STEP_UP_OPERATIONS.contains(op)) {
            throw WanderException.invalid("INVALID_OPERATION", "Thao tác không cần xác thực lại.", "operation");
        }
        Instant now = now();
        Instant expiresAt = now.plus(APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        String approvalCode = Secrets.newShortCode();
        store.saveStepUp(new StepUpRequest(id, p.identityId(), p.sessionId(), op, approvalCode, StepUpState.PENDING, null, now, expiresAt));
        return new StepUpCreated(id.toString(), approvalCode, Timestamps.format(expiresAt));
    }

    /** Phải do một phiên KHÁC của cùng danh tính duyệt: phiên đang xin không tự duyệt chính nó. */
    public Approved approveStepUp(AuthenticatedPrincipal p, Map<String, Object> in) {
        String code = Secrets.normalize(in.get("approvalCode"), Secrets.SHORT_CODE_SYMBOLS);
        WanderException fail = WanderException.invalid("INVALID_APPROVAL_CODE", "Mã phê duyệt không hợp lệ hoặc đã hết hạn.", null);
        if (code == null) throw fail;
        StepUpRequest r = store.findApprovableStepUp(Secrets.formatShort(code), p.identityId(), p.sessionId(), now())
                .orElseThrow(() -> fail);
        store.saveStepUp(r.approve(p.sessionId()));
        return Approved.YES;
    }

    private void consumeStepUp(AuthenticatedPrincipal p, Object requestId, String operation) {
        WanderException denied = WanderException.forbidden("STEP_UP_REQUIRED", "Cần xác thực lại để thực hiện thao tác này.");
        if (!(requestId instanceof String raw)) throw denied;
        StepUpRequest r = Ids.parse(raw)
                .flatMap(id -> store.findUsableStepUp(id, p.identityId(), p.sessionId(), operation, now()))
                .orElseThrow(() -> denied);
        store.saveStepUp(r.consume());
    }

    // ---------- hỗ trợ ----------

    static String attemptKey(Object v) {
        if (!(v instanceof String s) || !Secrets.ATTEMPT_KEY.matcher(s).matches()) {
            throw WanderException.invalid("INVALID_ATTEMPT", "Mã nhận diện lần thử không hợp lệ.", "attemptId");
        }
        return s;
    }

    static String sessionToken(Object v) {
        if (!(v instanceof String s) || !Secrets.SESSION_TOKEN.matcher(s).matches()) {
            throw WanderException.invalid("INVALID_SESSION_TOKEN", "Bí mật phiên không hợp lệ.", "sessionToken");
        }
        return s;
    }

    static WanderException tokenInUse() {
        return WanderException.invalid("INVALID_SESSION_TOKEN", "Bí mật phiên đã được dùng.", "sessionToken");
    }

    private static String hashOf(String displayedCode) {
        return Secrets.hashRecoveryCode(Secrets.normalize(displayedCode, Secrets.RECOVERY_CODE_SYMBOLS));
    }

    private static WanderException invalidCode() {
        return WanderException.invalid("INVALID_CODE", "Mã không hợp lệ hoặc đã được dùng.", null);
    }

    private static WanderException invalidReplacement() {
        return WanderException.invalid("INVALID_REPLACEMENT", "Mã thay thế không đúng.", null);
    }

    private Instant now() {
        return Timestamps.truncate(clock.instant());
    }
}
