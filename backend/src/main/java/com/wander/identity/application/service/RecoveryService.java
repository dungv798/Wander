package com.wander.identity.application.service;

import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.view.IdentityViews.Approved;
import com.wander.identity.application.view.IdentityViews.Committed;
import com.wander.identity.application.view.IdentityViews.RecoveryStarted;
import com.wander.identity.application.view.IdentityViews.ReplacementBegun;
import com.wander.identity.application.view.IdentityViews.StepUpCreated;
import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.model.IdentityModel.AttemptState;
import com.wander.identity.domain.model.IdentityModel.CodeReplacement;
import com.wander.identity.domain.model.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.ReplacementState;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.model.IdentityModel.StepUpRequest;
import com.wander.identity.domain.model.IdentityModel.StepUpState;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.domain.rule.Secrets;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
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

    private final IdentityStore store;
    private final Clock clock;

    /** Nhận cổng lưu trữ và đồng hồ (test thay bằng đồng hồ giả). */
    public RecoveryService(IdentityStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    // ---------- Khôi phục bằng mã (KP-C, D24) ----------

    /**
     * Bước 1–2: kiểm tra mã hiện hành, tạo lần thử chờ và phát hành mã thay thế (chưa hợp lệ).
     * Mã cũ CHƯA bị tiêu thụ; chưa có phiên nào được tạo (INV-15).
     */
    public RecoveryStarted startRecovery(Map<String, Object> input) {
        String attemptKey = IdentityInput.attemptKey(input.get(IdentityFields.ATTEMPT_ID));
        String tokenHash = Secrets.hashToken(IdentityInput.sessionToken(input.get(IdentityFields.SESSION_TOKEN)));
        String normalized = Secrets.normalize(input.get(IdentityFields.CODE), IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null) throw invalidCode();

        RecoveryCode oldCode = store.findActiveCodeByHash(Secrets.hashRecoveryCode(normalized)).orElseThrow(RecoveryService::invalidCode);
        String replacement = Secrets.newRecoveryCode();
        String replacementHash = Secrets.hashDisplayedRecoveryCode(replacement);
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.PENDING_TTL);

        Optional<RecoveryAttempt> existing = store.findAttemptForUpdate(attemptKey);
        if (existing.isPresent()) {
            store.saveAttempt(restartedAttempt(existing.get(), oldCode, tokenHash, replacementHash, expiresAt));
        } else {
            if (store.isTokenHashInUse(tokenHash)) throw IdentityInput.tokenInUse();
            store.saveAttempt(new RecoveryAttempt(UUID.randomUUID(), attemptKey, oldCode.identityId(), oldCode.id(), replacementHash,
                    tokenHash, AttemptState.PENDING, now, expiresAt));
        }
        return new RecoveryStarted(attemptKey, replacement, Timestamps.format(expiresAt));
    }

    /**
     * Bước 3–4: chủ nhập lại mã thay thế, rồi commit nguyên tử: vô hiệu mã cũ + kích hoạt mã thay thế + tạo phiên (INV-11).
     * Không thu hồi phiên nào khác (D23, INV-10). Gọi lại sau commit với cùng lần thử là idempotent (INV-12).
     */
    public Committed completeRecovery(Map<String, Object> input) {
        String attemptKey = IdentityInput.attemptKey(input.get(IdentityFields.ATTEMPT_ID));
        String normalized = Secrets.normalize(input.get(IdentityFields.REPLACEMENT_CODE), IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null) throw invalidReplacement();
        String replacementHash = Secrets.hashRecoveryCode(normalized);

        RecoveryAttempt attempt = store.findAttemptForUpdate(attemptKey).orElseThrow(RecoveryService::invalidCode);
        if (!attempt.replacementHash().equals(replacementHash)) throw invalidReplacement();
        if (attempt.state() == AttemptState.COMMITTED) return Committed.YES;
        if (attempt.state() != AttemptState.PENDING) throw invalidCode();
        Instant now = Timestamps.now(clock);
        if (attempt.isExpired(now)) {
            throw WanderException.invalid(IdentityErrorCodes.ATTEMPT_EXPIRED, IdentityMessages.RECOVERY_EXPIRED, null);
        }
        // Khóa dòng mã cũ: hai lần thử đồng thời cùng một mã ⇒ đúng một lần commit (INV-7).
        RecoveryCode oldCode = store.findCodeForUpdate(attempt.oldCodeId()).filter(RecoveryCode::isActive)
                .orElseThrow(() -> WanderException.conflict(IdentityErrorCodes.CODE_ALREADY_USED, IdentityMessages.CODE_ALREADY_USED));
        store.invalidateRecoveryCode(oldCode.invalidate(IdentityConstants.INVALIDATED_BY_RECOVERY, now));
        store.addRecoveryCode(RecoveryCode.issue(attempt.identityId(), attempt.replacementHash(), now));
        store.addSession(Session.open(attempt.identityId(), attempt.sessionTokenHash(), now));
        store.saveAttempt(attempt.withState(AttemptState.COMMITTED));
        return Committed.YES;
    }

    // ---------- Phát hành lần đầu và tái tạo mã từ một phiên hợp lệ (hai pha; D23, D25, MĐ-2) ----------

    /**
     * Pha 1: tạo mã thay thế chờ. Mã hiện hành (nếu có) vẫn hợp lệ đến khi pha 2 commit (INV-13).
     * Có mã hiện hành thì bắt buộc xác thực lại: trình mã hiện hành, hoặc phê duyệt từ thiết bị khác.
     */
    public ReplacementBegun beginReplacement(AuthenticatedPrincipal principal, Map<String, Object> input) {
        Optional<RecoveryCode> current = store.findActiveCode(principal.identityId());
        current.ifPresent(code -> requireStepUpEvidence(principal, input, code));
        // Tại mọi thời điểm chỉ có một mã thay thế chờ.
        store.voidPendingReplacements(principal.identityId());
        String replacement = Secrets.newRecoveryCode();
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.PENDING_TTL);
        UUID id = UUID.randomUUID();
        store.saveReplacement(new CodeReplacement(id, principal.identityId(), principal.sessionId(),
                current.map(RecoveryCode::id).orElse(null), Secrets.hashDisplayedRecoveryCode(replacement),
                ReplacementState.PENDING, now, expiresAt));
        return new ReplacementBegun(id.toString(), replacement, Timestamps.format(expiresAt));
    }

    /** Pha 2: chủ nhập lại mã thay thế; commit vô hiệu mã cũ và kích hoạt mã mới trong một giao dịch. */
    public Committed confirmReplacement(AuthenticatedPrincipal principal, Map<String, Object> input) {
        String normalized = Secrets.normalize(input.get(IdentityFields.REPLACEMENT_CODE), IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null || !(input.get(IdentityFields.PENDING_ID) instanceof String pendingId)) throw invalidReplacement();
        CodeReplacement replacement = Ids.parse(pendingId)
                .flatMap(id -> store.findPendingReplacement(id, principal.identityId()))
                .orElseThrow(() -> WanderException.notFound(IdentityMessages.NO_PENDING_REPLACEMENT));
        Instant now = Timestamps.now(clock);
        if (replacement.isExpired(now)) {
            throw WanderException.invalid(IdentityErrorCodes.ATTEMPT_EXPIRED, IdentityMessages.REPLACEMENT_EXPIRED, null);
        }
        if (!replacement.replacementHash().equals(Secrets.hashRecoveryCode(normalized))) throw invalidReplacement();
        Optional<RecoveryCode> current = store.findActiveCode(principal.identityId());
        if (!Objects.equals(current.map(RecoveryCode::id).orElse(null), replacement.oldCodeId())) {
            throw WanderException.conflict(IdentityErrorCodes.CODE_CHANGED, IdentityMessages.CODE_CHANGED);
        }
        current.ifPresent(code -> store.invalidateRecoveryCode(code.invalidate(IdentityConstants.INVALIDATED_BY_REPLACEMENT, now)));
        store.addRecoveryCode(RecoveryCode.issue(principal.identityId(), replacement.replacementHash(), now));
        store.saveReplacement(replacement.withState(ReplacementState.COMMITTED));
        return Committed.YES;
    }

    // ---------- Xác thực lại bằng phê duyệt từ thiết bị tin cậy khác (D25, MĐ-1) ----------

    /** Xin phê duyệt xác thực lại cho một thao tác nhạy cảm; trả mã ngắn để thiết bị khác nhập. */
    public StepUpCreated requestStepUp(AuthenticatedPrincipal principal, Map<String, Object> input) {
        if (!(input.get(IdentityFields.OPERATION) instanceof String operation) || !IdentityConstants.STEP_UP_OPERATIONS.contains(operation)) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_OPERATION, IdentityMessages.INVALID_OPERATION, IdentityFields.OPERATION);
        }
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        String approvalCode = Secrets.newShortCode();
        store.saveStepUp(new StepUpRequest(id, principal.identityId(), principal.sessionId(), operation, approvalCode,
                StepUpState.PENDING, null, now, expiresAt));
        return new StepUpCreated(id.toString(), approvalCode, Timestamps.format(expiresAt));
    }

    /** Phải do một phiên KHÁC của cùng danh tính duyệt: phiên đang xin không tự duyệt chính nó. */
    public Approved approveStepUp(AuthenticatedPrincipal principal, Map<String, Object> input) {
        String code = Secrets.normalize(input.get(IdentityFields.APPROVAL_CODE), IdentityConstants.SHORT_CODE_SYMBOLS);
        if (code == null) throw invalidApprovalCode();
        StepUpRequest request = store.findApprovableStepUp(Secrets.formatShort(code), principal.identityId(), principal.sessionId(),
                Timestamps.now(clock)).orElseThrow(RecoveryService::invalidApprovalCode);
        store.saveStepUp(request.approve(principal.sessionId()));
        return Approved.YES;
    }

    // ---------- hỗ trợ ----------

    /** Bắt buộc có bằng chứng xác thực lại hợp lệ (trình mã hiện hành hoặc phê duyệt từ thiết bị khác) trước khi tạo mã mới. */
    private void requireStepUpEvidence(AuthenticatedPrincipal principal, Map<String, Object> input, RecoveryCode current) {
        WanderException denied = WanderException.forbidden(IdentityErrorCodes.STEP_UP_REQUIRED, IdentityMessages.STEP_UP_REQUIRED_FOR_NEW_CODE);
        if (!(input.get(IdentityFields.EVIDENCE) instanceof Map<?, ?> evidence)) throw denied;
        Object type = evidence.get(IdentityFields.EVIDENCE_TYPE);
        if (IdentityFields.EVIDENCE_TYPE_CODE.equals(type)) {
            requireMatchesCurrentCode(evidence.get(IdentityFields.CODE), current, denied);
        } else if (IdentityFields.EVIDENCE_TYPE_APPROVAL.equals(type)) {
            consumeStepUp(principal, evidence.get(IdentityFields.REQUEST_ID), IdentityConstants.OPERATION_REGENERATE_CODE);
        } else {
            throw denied;
        }
    }

    /** Mã người dùng trình phải khớp mã khôi phục hiện hành; không khớp thì ném lỗi {@code denied}. */
    private static void requireMatchesCurrentCode(Object typedCode, RecoveryCode current, WanderException denied) {
        String normalized = Secrets.normalize(typedCode, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null || !Secrets.hashRecoveryCode(normalized).equals(current.codeHash())) throw denied;
    }

    /** Dùng (một lần) phê duyệt đã được duyệt cho đúng phiên và thao tác; không có thì ném STEP_UP_REQUIRED. */
    private void consumeStepUp(AuthenticatedPrincipal principal, Object requestId, String operation) {
        WanderException denied = WanderException.forbidden(IdentityErrorCodes.STEP_UP_REQUIRED, IdentityMessages.STEP_UP_REQUIRED);
        if (!(requestId instanceof String raw)) throw denied;
        StepUpRequest request = Ids.parse(raw)
                .flatMap(id -> store.findUsableStepUp(id, principal.identityId(), principal.sessionId(), operation, Timestamps.now(clock)))
                .orElseThrow(() -> denied);
        store.saveStepUp(request.consume());
    }

    /** Lần thử đã có được bắt đầu lại, nhưng chỉ cho chính bên đã tạo (cùng mã, cùng bí mật phiên) và khi còn chờ (MĐ-6). */
    private static RecoveryAttempt restartedAttempt(RecoveryAttempt attempt, RecoveryCode oldCode, String tokenHash,
                                                    String replacementHash, Instant expiresAt) {
        boolean sameOwner = attempt.state() == AttemptState.PENDING
                && attempt.oldCodeId().equals(oldCode.id())
                && attempt.sessionTokenHash().equals(tokenHash);
        if (!sameOwner) throw invalidCode();
        return attempt.restart(replacementHash, expiresAt);
    }

    /** Lỗi mã khôi phục sai hoặc đã được dùng. */
    private static WanderException invalidCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_CODE, IdentityMessages.INVALID_CODE, null);
    }

    /** Lỗi mã thay thế nhập lại không đúng. */
    private static WanderException invalidReplacement() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_REPLACEMENT, IdentityMessages.INVALID_REPLACEMENT, null);
    }

    /** Lỗi mã phê duyệt sai hoặc hết hạn. */
    private static WanderException invalidApprovalCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_APPROVAL_CODE, IdentityMessages.INVALID_APPROVAL_CODE, null);
    }
}
