package com.wander.identity.domain.model;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.rule.MatchChallenge;
import com.wander.identity.domain.vocabulary.EventKind;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Model of the Identity bounded context. Each record is a small immutable aggregate; a state change returns a new copy.
 * States are stored in lowercase in the database (pending, committed...).
 */
public final class IdentityModel {

    private IdentityModel() {
    }

    /** Anonymous identity: only an id and a creation time. */
    public record Identity(UUID id, Instant createdAt) {
    }

    /** The session of one device; the server keeps only the hash of the session secret. */
    public record Session(UUID id, UUID identityId, String tokenHash, Instant createdAt, Instant lastSeenAt, Instant revokedAt,
                          String deviceName) {

        /** Opens a new session for the identity, not revoked; {@code deviceName} is a device-declared label (may be null). */
        public static Session open(UUID identityId, String tokenHash, String deviceName, Instant now) {
            return new Session(UUID.randomUUID(), identityId, tokenHash, now, now, null, deviceName);
        }

        /** Whether enough time has passed since the last {@code lastSeenAt} write to be worth recording (fewer DB writes per request). */
        public boolean needsTouch(Instant now) {
            return !lastSeenAt.plus(IdentityConstants.SESSION_TOUCH_INTERVAL_MINUTES, ChronoUnit.MINUTES).isAfter(now);
        }

        /**
         * A session that is not revoked, has not hit the sliding limit and has not hit the absolute limit. The absolute limit applies ONLY to identities that already have a recovery code
         * (when the session ends they get back in with the code); an identity without a code that is forced out would lose its trips for good, so it only has the sliding limit (DR-039).
         * {@code hasRecoveryCode} is called only when the absolute limit has passed, so a normal request does not cost an extra query.
         */
        public boolean isActive(Instant now, java.util.function.BooleanSupplier hasRecoveryCode) {
            if (revokedAt != null || !lastSeenAt.plus(IdentityConstants.SESSION_IDLE_DAYS, ChronoUnit.DAYS).isAfter(now)) {
                return false;
            }
            boolean withinAbsolute = createdAt.plus(IdentityConstants.SESSION_ABSOLUTE_DAYS, ChronoUnit.DAYS).isAfter(now);
            return withinAbsolute || !hasRecoveryCode.getAsBoolean();
        }
    }

    /** Recovery code (hash only). At most one valid code per identity (D22, INV-13) - enforced in the database. */
    public record RecoveryCode(UUID id, UUID identityId, String codeHash, Instant createdAt, Instant invalidatedAt,
                               String invalidatedReason, String keyVersion) {

        /** Issues a new, valid code for the identity. */
        public static RecoveryCode issue(UUID identityId, String codeHash, Instant now, String keyVersion) {
            return new RecoveryCode(UUID.randomUUID(), identityId, codeHash, now, null, null, keyVersion);
        }

        /** The code is still valid (not invalidated). */
        public boolean isActive() {
            return invalidatedAt == null;
        }

        /** The invalidated version of this code with the given reason. */
        public RecoveryCode invalidate(String reason, Instant now) {
            return new RecoveryCode(id, identityId, codeHash, createdAt, now, reason, keyVersion);
        }
    }

    /** State of a recovery attempt. */
    public enum AttemptState { PENDING, COMMITTED, FAILED, EXPIRED }

    /** Recovery attempt (KP-C, D24): the old code is invalidated only when the replacement code is confirmed (commit). */
    public record RecoveryAttempt(UUID id, String attemptKey, UUID identityId, UUID oldCodeId, String replacementHash,
                                  String sessionTokenHash, AttemptState state, Instant createdAt, Instant expiresAt,
                                  String deviceName, String keyVersion) {

        /** Expired at time {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** A copy that restarts the same attempt with a new replacement code and a new time limit; a new device name (if given) replaces the old one, if not given the old name is kept. */
        public RecoveryAttempt restart(String newReplacementHash, Instant newExpiresAt, String newDeviceName, String newKeyVersion) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, newReplacementHash, sessionTokenHash, state, createdAt, newExpiresAt,
                    newDeviceName != null ? newDeviceName : deviceName, newKeyVersion);
        }

        /** A copy with the new state. */
        public RecoveryAttempt withState(AttemptState newState) {
            return new RecoveryAttempt(id, attemptKey, identityId, oldCodeId, replacementHash, sessionTokenHash, newState, createdAt, expiresAt,
                    deviceName, keyVersion);
        }
    }

    /** State of a replacement code. */
    public enum ReplacementState { PENDING, COMMITTED, VOID }

    /** Issue or regenerate the code from a valid session, in two phases (D23, D25, MĐ-2). */
    public record CodeReplacement(UUID id, UUID identityId, UUID sessionId, UUID oldCodeId, String replacementHash,
                                  ReplacementState state, Instant createdAt, Instant expiresAt, String keyVersion) {

        /** Expired at time {@code now}. */
        public boolean isExpired(Instant now) {
            return !expiresAt.isAfter(now);
        }

        /** A copy with the new state. */
        public CodeReplacement withState(ReplacementState newState) {
            return new CodeReplacement(id, identityId, sessionId, oldCodeId, replacementHash, newState, createdAt, expiresAt, keyVersion);
        }
    }

    /** A security event of the identity (BE-11); {@code deviceName} is a self-declared label (may be null), not verified. */
    public record SecurityEvent(UUID identityId, EventKind kind, String deviceName, Instant occurredAt) {
    }

    /** State of a device pairing request. */
    public enum LinkState { PENDING, APPROVED, EXPIRED, DENIED }

    /** A trusted device approves a new device (D21). The session secret is generated by the new device; the server keeps only the hash. */
    public record DeviceLink(UUID id, String pairingCode, String sessionTokenHash, LinkState state, UUID identityId,
                             Instant createdAt, Instant expiresAt, String deviceName, int matchNumber, String matchOptions) {

        /** The request's matching-number challenge (DR-018 E1). */
        public MatchChallenge challenge() {
            return MatchChallenge.of(matchNumber, matchOptions);
        }

        /** The state the user sees: a request that is still pending but past its limit counts as expired. */
        public LinkState visibleState(Instant now) {
            return state == LinkState.PENDING && !expiresAt.isAfter(now) ? LinkState.EXPIRED : state;
        }

        /** A copy that was approved by the identity of the old device. */
        public DeviceLink approve(UUID approverIdentityId) {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.APPROVED, approverIdentityId, createdAt, expiresAt,
                    deviceName, matchNumber, matchOptions);
        }

        /** A copy that was denied (wrong number chosen or actively denied): it can never be approved again. */
        public DeviceLink deny() {
            return new DeviceLink(id, pairingCode, sessionTokenHash, LinkState.DENIED, identityId, createdAt, expiresAt,
                    deviceName, matchNumber, matchOptions);
        }
    }

    /** State of a re-authentication request. */
    public enum StepUpState { PENDING, APPROVED, CONSUMED, DENIED }

    /** Re-authentication through approval from ANOTHER session of the same identity (D25, MĐ-1). */
    public record StepUpRequest(UUID id, UUID identityId, UUID sessionId, String operation, String approvalCode,
                                StepUpState state, UUID approvedBySession, Instant createdAt, Instant expiresAt,
                                int matchNumber, String matchOptions) {

        /** The request's matching-number challenge (DR-018 E1). */
        public MatchChallenge challenge() {
            return MatchChallenge.of(matchNumber, matchOptions);
        }

        /** A copy that was denied (wrong number chosen or actively denied): it can never be approved again. */
        public StepUpRequest deny() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.DENIED, null, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }

        /** A copy that was approved by another session. */
        public StepUpRequest approve(UUID approverSession) {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.APPROVED, approverSession, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }

        /** A copy that was consumed (each approval is single-use). */
        public StepUpRequest consume() {
            return new StepUpRequest(id, identityId, sessionId, operation, approvalCode, StepUpState.CONSUMED, approvedBySession, createdAt, expiresAt,
                    matchNumber, matchOptions);
        }
    }
}
