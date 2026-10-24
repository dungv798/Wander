package com.wander.identity.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Mô hình của bounded context Identity. Mỗi record là một aggregate nhỏ, bất biến; chuyển trạng thái trả về bản mới.
 * Trạng thái lưu dạng chữ thường trong cơ sở dữ liệu (pending, committed…).
 */
public final class IdentityModel {

    private IdentityModel() {
    }

    public record Identity(UUID id, Instant createdAt) {
    }

    public record Session(UUID id, UUID identityId, String tokenHash, Instant createdAt, Instant lastSeenAt, Instant revokedAt) {
        public static Session open(UUID identityId, String tokenHash, Instant now) {
            return new Session(UUID.randomUUID(), identityId, tokenHash, now, now, null);
        }

        public boolean isActive() {
            return revokedAt == null;
        }
    }

    /** Mã khôi phục (chỉ băm). Tối đa một mã hợp lệ cho mỗi danh tính (D22, INV-13) — có ràng buộc ở cơ sở dữ liệu. */
    public record RecoveryCode(UUID id, UUID identityId, String codeHash, Instant createdAt, Instant invalidatedAt,
                               String invalidatedReason) {
        public static RecoveryCode issue(UUID identityId, String codeHash, Instant now) {
            return new RecoveryCode(UUID.randomUUID(), identityId, codeHash, now, null, null);
        }

        public boolean isActive() {
            return invalidatedAt == null;
        }

        public RecoveryCode invalidate(String reason, Instant now) {
            return new RecoveryCode(id, identityId, codeHash, createdAt, now, reason);
        }
    }

    public enum AttemptState { PENDING, COMMITTED, FAILED, EXPIRED }

    /** Lần thử khôi phục (KP-C, D24): mã cũ chỉ vô hiệu khi mã thay thế được xác nhận (commit). */
    public record RecoveryAttempt(UUID id, String attemptKey, UUID identityId, UUID oldCodeId, String replacementHash,
                                  String sessionTokenHash, AttemptState state, Instant createdAt, Instant expiresAt) {
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        public RecoveryAttempt restart(String newReplacementHash, Instant newExpiresAt) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, newReplacementHash, sessionTokenHash, state, createdAt, newExpiresAt);
        }

        public RecoveryAttempt withState(AttemptState s) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, replacementHash, sessionTokenHash, s, createdAt, expiresAt);
        }
    }

    public enum ReplacementState { PENDING, COMMITTED, VOID }

    /** Phát hành hoặc tái tạo mã từ một phiên hợp lệ, hai pha (D23, D25, MĐ-2). */
    public record CodeReplacement(UUID id, UUID identityId, UUID sessionId, UUID oldCodeId, String replacementHash,
                                  ReplacementState state, Instant createdAt, Instant expiresAt) {
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        public CodeReplacement withState(ReplacementState s) {
            return new CodeReplacement(id, identityId, sessionId, oldCodeId, replacementHash, s, createdAt, expiresAt);
        }
    }

    public enum LinkState { PENDING, APPROVED, EXPIRED }

    /** Thiết bị tin cậy duyệt thiết bị mới (D21). Bí mật phiên do thiết bị mới tự sinh; server chỉ giữ băm. */
    public record DeviceLink(UUID id, String pairingCode, String sessionTokenHash, LinkState state, UUID identityId,
                             Instant createdAt, Instant expiresAt) {
        public LinkState visibleState(Instant now) {
            return state == LinkState.PENDING && !expiresAt.isAfter(now) ? LinkState.EXPIRED : state;
        }

        public DeviceLink approve(UUID approverIdentityId) {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.APPROVED, approverIdentityId, createdAt, expiresAt);
        }
    }

    public enum StepUpState { PENDING, APPROVED, CONSUMED }

    /** Xác thực lại bằng phê duyệt từ một phiên KHÁC của cùng danh tính (D25, MĐ-1). */
    public record StepUpRequest(UUID id, UUID identityId, UUID sessionId, String operation, String approvalCode,
                                StepUpState state, UUID approvedBySession, Instant createdAt, Instant expiresAt) {
        public StepUpRequest approve(UUID approverSession) {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.APPROVED, approverSession, createdAt, expiresAt);
        }

        public StepUpRequest consume() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.CONSUMED, approvedBySession, createdAt, expiresAt);
        }
    }
}
