package com.wander.identity.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Mô hình của bounded context Identity. Mỗi record là một aggregate nhỏ, bất biến; chuyển trạng thái trả về bản mới.
 * Trạng thái lưu dạng chữ thường trong cơ sở dữ liệu (pending, committed…).
 */
public final class IdentityModel {

    private IdentityModel() {
    }

    /** Danh tính ẩn danh: chỉ có mã và thời điểm tạo. */
    public record Identity(UUID id, Instant createdAt) {
    }

    /** Phiên của một thiết bị; server chỉ giữ băm của bí mật phiên. */
    public record Session(UUID id, UUID identityId, String tokenHash, Instant createdAt, Instant lastSeenAt, Instant revokedAt) {

        /** Mở phiên mới cho danh tính, chưa bị thu hồi. */
        public static Session open(UUID identityId, String tokenHash, Instant now) {
            return new Session(UUID.randomUUID(), identityId, tokenHash, now, now, null);
        }

        /** Phiên còn hiệu lực (chưa bị thu hồi). */
        public boolean isActive() {
            return revokedAt == null;
        }
    }

    /** Mã khôi phục (chỉ băm). Tối đa một mã hợp lệ cho mỗi danh tính (D22, INV-13) — có ràng buộc ở cơ sở dữ liệu. */
    public record RecoveryCode(UUID id, UUID identityId, String codeHash, Instant createdAt, Instant invalidatedAt,
                               String invalidatedReason) {

        /** Phát hành mã mới còn hợp lệ cho danh tính. */
        public static RecoveryCode issue(UUID identityId, String codeHash, Instant now) {
            return new RecoveryCode(UUID.randomUUID(), identityId, codeHash, now, null, null);
        }

        /** Mã còn hợp lệ (chưa bị vô hiệu). */
        public boolean isActive() {
            return invalidatedAt == null;
        }

        /** Bản đã vô hiệu của mã này với lý do cho trước. */
        public RecoveryCode invalidate(String reason, Instant now) {
            return new RecoveryCode(id, identityId, codeHash, createdAt, now, reason);
        }
    }

    /** Trạng thái một lần thử khôi phục. */
    public enum AttemptState { PENDING, COMMITTED, FAILED, EXPIRED }

    /** Lần thử khôi phục (KP-C, D24): mã cũ chỉ vô hiệu khi mã thay thế được xác nhận (commit). */
    public record RecoveryAttempt(UUID id, String attemptKey, UUID identityId, UUID oldCodeId, String replacementHash,
                                  String sessionTokenHash, AttemptState state, Instant createdAt, Instant expiresAt) {

        /** Đã quá hạn tại thời điểm {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** Bản bắt đầu lại cùng lần thử với mã thay thế mới và hạn mới. */
        public RecoveryAttempt restart(String newReplacementHash, Instant newExpiresAt) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, newReplacementHash, sessionTokenHash, state, createdAt, newExpiresAt);
        }

        /** Bản có trạng thái mới. */
        public RecoveryAttempt withState(AttemptState newState) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, replacementHash, sessionTokenHash, newState, createdAt, expiresAt);
        }
    }

    /** Trạng thái một mã thay thế. */
    public enum ReplacementState { PENDING, COMMITTED, VOID }

    /** Phát hành hoặc tái tạo mã từ một phiên hợp lệ, hai pha (D23, D25, MĐ-2). */
    public record CodeReplacement(UUID id, UUID identityId, UUID sessionId, UUID oldCodeId, String replacementHash,
                                  ReplacementState state, Instant createdAt, Instant expiresAt) {

        /** Đã quá hạn tại thời điểm {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** Bản có trạng thái mới. */
        public CodeReplacement withState(ReplacementState newState) {
            return new CodeReplacement(id, identityId, sessionId, oldCodeId, replacementHash, newState, createdAt, expiresAt);
        }
    }

    /** Trạng thái một yêu cầu ghép thiết bị. */
    public enum LinkState { PENDING, APPROVED, EXPIRED }

    /** Thiết bị tin cậy duyệt thiết bị mới (D21). Bí mật phiên do thiết bị mới tự sinh; server chỉ giữ băm. */
    public record DeviceLink(UUID id, String pairingCode, String sessionTokenHash, LinkState state, UUID identityId,
                             Instant createdAt, Instant expiresAt) {

        /** Trạng thái người dùng thấy: yêu cầu còn chờ nhưng quá hạn thì coi là hết hạn. */
        public LinkState visibleState(Instant now) {
            return state == LinkState.PENDING && !expiresAt.isAfter(now) ? LinkState.EXPIRED : state;
        }

        /** Bản đã được duyệt bởi danh tính của thiết bị cũ. */
        public DeviceLink approve(UUID approverIdentityId) {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.APPROVED, approverIdentityId, createdAt, expiresAt);
        }
    }

    /** Trạng thái một yêu cầu xác thực lại. */
    public enum StepUpState { PENDING, APPROVED, CONSUMED }

    /** Xác thực lại bằng phê duyệt từ một phiên KHÁC của cùng danh tính (D25, MĐ-1). */
    public record StepUpRequest(UUID id, UUID identityId, UUID sessionId, String operation, String approvalCode,
                                StepUpState state, UUID approvedBySession, Instant createdAt, Instant expiresAt) {

        /** Bản đã được phê duyệt bởi một phiên khác. */
        public StepUpRequest approve(UUID approverSession) {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.APPROVED, approverSession, createdAt, expiresAt);
        }

        /** Bản đã được dùng (mỗi phê duyệt chỉ dùng một lần). */
        public StepUpRequest consume() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.CONSUMED, approvedBySession, createdAt, expiresAt);
        }
    }
}
