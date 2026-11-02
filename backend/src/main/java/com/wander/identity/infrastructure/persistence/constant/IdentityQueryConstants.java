package com.wander.identity.infrastructure.persistence.constant;


/** Câu JPQL của các repository Identity (tầng CHỨC NĂNG). Tên tham số {@code :x} khớp {@code @Param("x")} ở repository. */
public final class IdentityQueryConstants {

    /** Danh tính theo id, dùng để khóa các thay đổi mã khôi phục. */
    public static final String IDENTITY_BY_ID = "select i from IdentityEntity i where i.id = :id";

    /** Các nhãn khóa còn cần để xác minh mã đang hiệu lực hoặc mã chờ chưa hết hạn. */
    public static final String REQUIRED_RECOVERY_KEY_VERSIONS = "SELECT key_version FROM recovery_codes WHERE invalidated_at IS NULL "
            + "UNION SELECT key_version FROM recovery_attempts WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP "
            + "UNION SELECT key_version FROM code_replacements WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP";

    private static final String PENDING = "'" + IdentityPersistenceConstants.STATE_PENDING + "'";
    private static final String VOID = "'" + IdentityPersistenceConstants.STATE_VOID + "'";
    private static final String APPROVED = "'" + IdentityPersistenceConstants.STATE_APPROVED + "'";

    /** Xóa sự kiện cũ vượt quá số giữ lại của một danh tính (SQL thuần vì cần OFFSET). */
    public static final String PRUNE_EVENTS = "DELETE FROM identity_events WHERE identity_id = :identity AND id IN ("
            + "SELECT id FROM identity_events WHERE identity_id = :identity ORDER BY id DESC OFFSET :keep)";

    /** Có sự kiện thêm thiết bị (mã `paired`/`recovered` của EventKind, có test canh) có mã lớn hơn mốc "đã xem" (chưa xem lần nào thì mọi sự kiện đó đều mới). */
    public static final String HAS_UNSEEN_ALERT = "SELECT EXISTS (SELECT 1 FROM identity_events e JOIN identities i ON i.id = e.identity_id "
            + "WHERE e.identity_id = :identity AND e.kind IN ('paired', 'recovered') "
            + "AND (i.events_seen_id IS NULL OR e.id > i.events_seen_id))";

    /** Ghi mốc "đã xem" của danh tính: mã sự kiện lớn nhất hiện có (0 nếu chưa có sự kiện nào). */
    public static final String MARK_EVENTS_SEEN = "UPDATE identities SET events_seen_id = COALESCE("
            + "(SELECT max(id) FROM identity_events WHERE identity_id = :identity), 0) WHERE id = :identity";

    /** Ghi thời điểm phiên được dùng gần nhất. */
    public static final String TOUCH_SESSION = "update SessionEntity s set s.lastSeenAt = :now where s.id = :id";

    /** Đặt hoặc xóa tên thiết bị của phiên chưa bị thu hồi. */
    public static final String RENAME_SESSION = "update SessionEntity s set s.deviceName = :name where s.id = :id and s.revokedAt is null";

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
