package com.wander.identity.domain.model;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.rule.MatchChallenge;
import com.wander.identity.domain.vocabulary.EventKind;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    public record Session(UUID id, UUID identityId, String tokenHash, Instant createdAt, Instant lastSeenAt, Instant revokedAt,
                          String deviceName) {

        /** Mở phiên mới cho danh tính, chưa bị thu hồi; {@code deviceName} là nhãn thiết bị tự khai (có thể null). */
        public static Session open(UUID identityId, String tokenHash, String deviceName, Instant now) {
            return new Session(UUID.randomUUID(), identityId, tokenHash, now, now, null, deviceName);
        }

        /** Đã đủ lâu kể từ lần ghi {@code lastSeenAt} gần nhất để đáng ghi lại (giảm ghi DB mỗi yêu cầu). */
        public boolean needsTouch(Instant now) {
            return !lastSeenAt.plus(IdentityConstants.SESSION_TOUCH_INTERVAL_MINUTES, ChronoUnit.MINUTES).isAfter(now);
        }

        /** Phiên chưa bị thu hồi và chưa chạm hạn trượt hoặc hạn tuyệt đối tại thời điểm kiểm tra. */
        public boolean isActive(Instant now) {
            return revokedAt == null
                    && lastSeenAt.plus(IdentityConstants.SESSION_IDLE_DAYS, ChronoUnit.DAYS).isAfter(now)
                    && createdAt.plus(IdentityConstants.SESSION_ABSOLUTE_DAYS, ChronoUnit.DAYS).isAfter(now);
        }
    }

    /** Mã khôi phục (chỉ băm). Tối đa một mã hợp lệ cho mỗi danh tính (D22, INV-13) — có ràng buộc ở cơ sở dữ liệu. */
    public record RecoveryCode(UUID id, UUID identityId, String codeHash, Instant createdAt, Instant invalidatedAt,
                               String invalidatedReason, String keyVersion) {

        /** Phát hành mã mới còn hợp lệ cho danh tính. */
        public static RecoveryCode issue(UUID identityId, String codeHash, Instant now, String keyVersion) {
            return new RecoveryCode(UUID.randomUUID(), identityId, codeHash, now, null, null, keyVersion);
        }

        /** Mã còn hợp lệ (chưa bị vô hiệu). */
        public boolean isActive() {
            return invalidatedAt == null;
        }

        /** Bản đã vô hiệu của mã này với lý do cho trước. */
        public RecoveryCode invalidate(String reason, Instant now) {
            return new RecoveryCode(id, identityId, codeHash, createdAt, now, reason, keyVersion);
        }
    }

    /** Trạng thái một lần thử khôi phục. */
    public enum AttemptState { PENDING, COMMITTED, FAILED, EXPIRED }

    /** Lần thử khôi phục (KP-C, D24): mã cũ chỉ vô hiệu khi mã thay thế được xác nhận (commit). */
    public record RecoveryAttempt(UUID id, String attemptKey, UUID identityId, UUID oldCodeId, String replacementHash,
                                  String sessionTokenHash, AttemptState state, Instant createdAt, Instant expiresAt,
                                  String deviceName, String keyVersion) {

        /** Đã quá hạn tại thời điểm {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** Bản bắt đầu lại cùng lần thử với mã thay thế mới và hạn mới; tên thiết bị mới (nếu có) thay tên cũ, không nêu thì giữ tên cũ. */
        public RecoveryAttempt restart(String newReplacementHash, Instant newExpiresAt, String newDeviceName, String newKeyVersion) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, newReplacementHash, sessionTokenHash, state, createdAt, newExpiresAt,
                    newDeviceName != null ? newDeviceName : deviceName, newKeyVersion);
        }

        /** Bản có trạng thái mới. */
        public RecoveryAttempt withState(AttemptState newState) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, replacementHash, sessionTokenHash, newState, createdAt, expiresAt,
                    deviceName, keyVersion);
        }
    }

    /** Trạng thái một mã thay thế. */
    public enum ReplacementState { PENDING, COMMITTED, VOID }

    /** Phát hành hoặc tái tạo mã từ một phiên hợp lệ, hai pha (D23, D25, MĐ-2). */
    public record CodeReplacement(UUID id, UUID identityId, UUID sessionId, UUID oldCodeId, String replacementHash,
                                  ReplacementState state, Instant createdAt, Instant expiresAt, String keyVersion) {

        /** Đã quá hạn tại thời điểm {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** Bản có trạng thái mới. */
        public CodeReplacement withState(ReplacementState newState) {
            return new CodeReplacement(id, identityId, sessionId, oldCodeId, replacementHash, newState, createdAt, expiresAt, keyVersion);
        }
    }

    /** Một sự kiện bảo mật của danh tính (BE-11); {@code deviceName} là nhãn tự khai (có thể null), chưa xác minh. */
    public record SecurityEvent(UUID identityId, EventKind kind, String deviceName, Instant occurredAt) {
    }

    /** Trạng thái một yêu cầu ghép thiết bị. */
    public enum LinkState { PENDING, APPROVED, EXPIRED, DENIED }

    /** Thiết bị tin cậy duyệt thiết bị mới (D21). Bí mật phiên do thiết bị mới tự sinh; server chỉ giữ băm. */
    public record DeviceLink(UUID id, String pairingCode, String sessionTokenHash, LinkState state, UUID identityId,
                             Instant createdAt, Instant expiresAt, String deviceName, int matchNumber, String matchOptions) {

        /** Thử thách số khớp của yêu cầu (DR-018 E1). */
        public MatchChallenge challenge() {
            return MatchChallenge.of(matchNumber, matchOptions);
        }

        /** Trạng thái người dùng thấy: yêu cầu còn chờ nhưng quá hạn thì coi là hết hạn. */
        public LinkState visibleState(Instant now) {
            return state == LinkState.PENDING && !expiresAt.isAfter(now) ? LinkState.EXPIRED : state;
        }

        /** Bản đã được duyệt bởi danh tính của thiết bị cũ. */
        public DeviceLink approve(UUID approverIdentityId) {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.APPROVED, approverIdentityId, createdAt, expiresAt,
                    deviceName, matchNumber, matchOptions);
        }

        /** Bản bị từ chối (chọn sai số hoặc từ chối chủ động): không bao giờ duyệt lại được. */
        public DeviceLink deny() {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.DENIED, identityId, createdAt, expiresAt,
                    deviceName, matchNumber, matchOptions);
        }
    }

    /** Trạng thái một yêu cầu xác thực lại. */
    public enum StepUpState { PENDING, APPROVED, CONSUMED, DENIED }

    /** Xác thực lại bằng phê duyệt từ một phiên KHÁC của cùng danh tính (D25, MĐ-1). */
    public record StepUpRequest(UUID id, UUID identityId, UUID sessionId, String operation, String approvalCode,
                                StepUpState state, UUID approvedBySession, Instant createdAt, Instant expiresAt,
                                int matchNumber, String matchOptions) {

        /** Thử thách số khớp của yêu cầu (DR-018 E1). */
        public MatchChallenge challenge() {
            return MatchChallenge.of(matchNumber, matchOptions);
        }

        /** Bản bị từ chối (chọn sai số hoặc từ chối chủ động): không bao giờ duyệt lại được. */
        public StepUpRequest deny() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.DENIED, null, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }

        /** Bản đã được phê duyệt bởi một phiên khác. */
        public StepUpRequest approve(UUID approverSession) {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.APPROVED, approverSession, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }

        /** Bản đã được dùng (mỗi phê duyệt chỉ dùng một lần). */
        public StepUpRequest consume() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.CONSUMED, approvedBySession, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }
    }
}
