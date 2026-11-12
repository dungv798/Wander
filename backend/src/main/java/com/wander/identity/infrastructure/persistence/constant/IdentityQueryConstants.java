package com.wander.identity.infrastructure.persistence.constant;


/** JPQL queries of the Identity repositories (FEATURE tier). The parameter name {@code :x} matches {@code @Param("x")} in the repository. */
public final class IdentityQueryConstants {

    /** The identity by id, used to lock recovery-code changes. */
    public static final String IDENTITY_BY_ID = "select i from IdentityEntity i where i.id = :id";

    /** Records the key fingerprint if the label is not there yet; no error when two instances write at the same time. */
    public static final String INSERT_KEY_CHECK_IF_ABSENT = "INSERT INTO recovery_key_checks (key_version, fingerprint, created_at) "
            + "VALUES (:version, :fingerprint, :now) ON CONFLICT (key_version) DO NOTHING";

    /** The key labels still needed to verify codes in force or pending codes that have not expired. */
    public static final String REQUIRED_RECOVERY_KEY_VERSIONS = "SELECT key_version FROM recovery_codes WHERE invalidated_at IS NULL "
            + "UNION SELECT key_version FROM recovery_attempts WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP "
            + "UNION SELECT key_version FROM code_replacements WHERE state = 'pending' AND expires_at > CURRENT_TIMESTAMP";

    private static final String PENDING = "'" + IdentityPersistenceConstants.STATE_PENDING + "'";
    private static final String VOID = "'" + IdentityPersistenceConstants.STATE_VOID + "'";
    private static final String APPROVED = "'" + IdentityPersistenceConstants.STATE_APPROVED + "'";

    /** Idempotent append of a security event: a second delivery of the same event id inserts nothing. */
    public static final String INSERT_EVENT_IF_ABSENT = "INSERT INTO identity_events (event_id, identity_id, kind, device_name, occurred_at) "
            + "VALUES (:eventId, :identity, :kind, :deviceName, :occurredAt) ON CONFLICT (event_id) DO NOTHING";

    /** Deletes the events of an identity beyond the number to keep (plain SQL because it needs OFFSET). */
    public static final String PRUNE_EVENTS = "DELETE FROM identity_events WHERE identity_id = :identity AND id IN ("
            + "SELECT id FROM identity_events WHERE identity_id = :identity ORDER BY id DESC OFFSET :keep)";

    /** Whether there is a device-added event (kind `paired`/`recovered` of EventKind, guarded by a test) with an id greater than the 'seen' mark (if never seen, every such event is new). */
    public static final String HAS_UNSEEN_ALERT = "SELECT EXISTS (SELECT 1 FROM identity_events e JOIN identities i ON i.id = e.identity_id "
            + "WHERE e.identity_id = :identity AND e.kind IN ('paired', 'recovered') "
            + "AND (i.events_seen_id IS NULL OR e.id > i.events_seen_id))";

    /** Records the identity's 'seen' mark: the largest existing event id (0 if there is no event). */
    public static final String MARK_EVENTS_SEEN = "UPDATE identities SET events_seen_id = COALESCE("
            + "(SELECT max(id) FROM identity_events WHERE identity_id = :identity), 0) WHERE id = :identity";

    /** Records the time the session was last used. */
    public static final String TOUCH_SESSION = "update SessionEntity s set s.lastSeenAt = :now where s.id = :id";

    /** Sets or clears the device name of a session that is not revoked. */
    public static final String RENAME_SESSION = "update SessionEntity s set s.deviceName = :name where s.id = :id and s.revokedAt is null";

    /** Revokes a session that is not revoked. */
    public static final String REVOKE_SESSION = "update SessionEntity s set s.revokedAt = :now where s.id = :id and s.revokedAt is null";

    /** The recovery code by id (used with a write lock). */
    public static final String RECOVERY_CODE_BY_ID = "select c from RecoveryCodeEntity c where c.id = :id";

    /** The recovery attempt by its id (used with a write lock). */
    public static final String ATTEMPT_BY_KEY = "select a from RecoveryAttemptEntity a where a.attemptKey = :key";

    /** The pairing request that is pending and not expired, by pairing code (used with a write lock). */
    public static final String ACTIVE_LINK_BY_PAIRING_CODE =
            "select d from DeviceLinkEntity d where d.pairingCode = :code and d.state = " + PENDING + " and d.expiresAt > :now";

    /** Cancels every pending replacement code of an identity. */
    public static final String VOID_PENDING_REPLACEMENTS =
            "update CodeReplacementEntity r set r.state = " + VOID + " where r.identityId = :identity and r.state = " + PENDING;

    /** A re-authentication request that can be approved: right code, right identity, pending, not expired, requested by ANOTHER session. */
    public static final String APPROVABLE_STEP_UP = "select r from StepUpRequestEntity r "
            + "where r.approvalCode = :code and r.identityId = :identity and r.sessionId <> :session "
            + "and r.state = " + PENDING + " and r.expiresAt > :now";

    /** A re-authentication request that was approved and is usable for exactly this session and action, not expired. */
    public static final String USABLE_STEP_UP = "select r from StepUpRequestEntity r "
            + "where r.id = :id and r.identityId = :identity and r.sessionId = :session and r.operation = :op "
            + "and r.state = " + APPROVED + " and r.expiresAt > :now";

    private IdentityQueryConstants() {
    }
}
