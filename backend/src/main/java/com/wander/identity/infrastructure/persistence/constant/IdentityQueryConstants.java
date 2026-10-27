package com.wander.identity.infrastructure.persistence.constant;

/** Câu JPQL của các repository Identity (tầng CHỨC NĂNG). Tên tham số {@code :x} khớp {@code @Param("x")} ở repository. */
public final class IdentityQueryConstants {

    private static final String PENDING = "'" + IdentityPersistenceConstants.STATE_PENDING + "'";
    private static final String VOID = "'" + IdentityPersistenceConstants.STATE_VOID + "'";
    private static final String APPROVED = "'" + IdentityPersistenceConstants.STATE_APPROVED + "'";

    /** Ghi thời điểm phiên được dùng gần nhất. */
    public static final String TOUCH_SESSION = "update SessionEntity s set s.lastSeenAt = :now where s.id = :id";

    /** Thu hồi phiên chưa bị thu hồi. */
    public static final String REVOKE_SESSION = "update SessionEntity s set s.revokedAt = :now where s.id = :id and s.revokedAt is null";

    /** Mã khôi phục theo id (dùng với khóa ghi). */
    public static final String RECOVERY_CODE_BY_ID = "select c from RecoveryCodeEntity c where c.id = :id";

    /** Lần thử khôi phục theo mã nhận diện (dùng với khóa ghi). */
    public static final String ATTEMPT_BY_KEY = "select a from RecoveryAttemptEntity a where a.attemptKey = :key";

    /** Yêu cầu ghép còn chờ và còn hạn theo mã ghép (dùng với khóa ghi). */
    public static final String ACTIVE_LINK_BY_PAIRING_CODE =
            "select d from DeviceLinkEntity d where d.pairingCode = :code and d.state = " + PENDING + " and d.expiresAt > :now";

    /** Hủy mọi mã thay thế đang chờ của một danh tính. */
    public static final String VOID_PENDING_REPLACEMENTS =
            "update CodeReplacementEntity r set r.state = " + VOID + " where r.identityId = :identity and r.state = " + PENDING;

    /** Yêu cầu xác thực lại có thể duyệt: đúng mã, đúng danh tính, đang chờ, còn hạn, do phiên KHÁC xin. */
    public static final String APPROVABLE_STEP_UP = "select r from StepUpRequestEntity r "
            + "where r.approvalCode = :code and r.identityId = :identity and r.sessionId <> :session "
            + "and r.state = " + PENDING + " and r.expiresAt > :now";

    /** Yêu cầu xác thực lại đã duyệt và dùng được cho đúng phiên, đúng thao tác, còn hạn. */
    public static final String USABLE_STEP_UP = "select r from StepUpRequestEntity r "
            + "where r.id = :id and r.identityId = :identity and r.sessionId = :session and r.operation = :op "
            + "and r.state = " + APPROVED + " and r.expiresAt > :now";

    private IdentityQueryConstants() {
    }
}
