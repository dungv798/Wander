package com.wander.identity.domain.port;

import com.wander.identity.domain.model.IdentityModel.CodeReplacement;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.SecurityEvent;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.model.IdentityModel.StepUpRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Storage port of Identity. A method with {@code ForUpdate} in its name locks the row (SELECT ... FOR UPDATE)
 * so two concurrent requests cannot consume the same code (INV-7).
 */
public interface IdentityStore {

    // ---- identities, sessions ----

    /** Saves a new identity. */
    void addIdentity(Identity identity);

    /** Locks the identity until the end of the transaction, serializing every recovery-code change in the same lock order. */
    void lockIdentity(UUID identityId);

    /** Saves a new session. */
    void addSession(Session session);

    /** The session by its secret hash (whether it is still valid is checked by the caller). */
    Optional<Session> findSessionByTokenHash(String tokenHash);

    /** Records the time the session was last used. */
    void touchSession(UUID sessionId, Instant now);

    /** The identity's sessions that are not revoked, in creation order. */
    List<Session> activeSessions(UUID identityId);

    /** A session of exactly this identity that is not revoked; another person's session counts as absent. */
    Optional<Session> findActiveSession(UUID sessionId, UUID identityId);

    /** Records a security event and then trims, keeping only the {@code keepLatest} newest events of the identity. */
    boolean addEvent(UUID eventId, SecurityEvent event, int keepLatest);

    /** At most {@code limit} of the identity's latest events, newest first. */
    List<SecurityEvent> recentEvents(UUID identityId, int limit);

    /** Whether there is a device-added event (pairing, recovery) newer than the last time it was viewed. */
    boolean hasUnseenAlert(UUID identityId);

    /** Records the identity's 'seen' mark: every existing event counts as seen. */
    void markEventsSeen(UUID identityId);

    /** Revokes a session. */
    void revokeSession(UUID sessionId, Instant now);

    /** Sets or clears (null) the device name of a session. */
    void renameSession(UUID sessionId, String deviceName);

    /** The session secret already belongs to a session, a pending recovery, or a pending device pairing request. */
    boolean isTokenHashInUse(String tokenHash);

    // ---- recovery codes ----

    /** Saves a new recovery code. */
    void addRecoveryCode(RecoveryCode code);

    /** Writes the invalidation of the code right away (flush) before adding a new code, because of the 'one valid code per identity' constraint. */
    void invalidateRecoveryCode(RecoveryCode invalidated);

    /** The code that is still valid, by hash. */
    Optional<RecoveryCode> findActiveCodeByHash(String codeHash);

    /** The identity's valid code (if it has one). */
    Optional<RecoveryCode> findActiveCode(UUID identityId);

    /** The code by id, row-locked so that of two concurrent recoveries with the same code only one wins. */
    Optional<RecoveryCode> findCodeForUpdate(UUID codeId);

    // ---- recovery attempts ----

    /** The attempt by its id, row-locked. */
    Optional<RecoveryAttempt> findAttemptForUpdate(String attemptKey);

    /** Reads the attempt to find the identity before locking; it must be read again with a lock before the state changes. */
    Optional<RecoveryAttempt> findAttempt(String attemptKey);

    /** Saves the attempt (insert or update). */
    void saveAttempt(RecoveryAttempt attempt);

    // ---- code regeneration ----

    /** Cancels every pending replacement code of the identity (there is only one pending code at any moment). */
    void voidPendingReplacements(UUID identityId);

    /** Saves a replacement code (insert or update). */
    void saveReplacement(CodeReplacement replacement);

    /** The pending replacement code of exactly this identity. */
    Optional<CodeReplacement> findPendingReplacement(UUID id, UUID identityId);

    // ---- device pairing ----

    /** The pairing code is in use by a request that has not expired. */
    boolean isPairingCodeActive(String pairingCode, Instant now);

    /** Saves a device pairing request (insert or update). */
    void saveDeviceLink(DeviceLink link);

    /** A device pairing request by id. */
    Optional<DeviceLink> findDeviceLink(UUID id);

    /** A pairing request that is pending and not expired for the pairing code, read without a lock (preview). */
    Optional<DeviceLink> findActiveDeviceLink(String pairingCode, Instant now);

    /** A pairing request that is pending and not expired for the pairing code, row-locked so the code is single-use. */
    Optional<DeviceLink> findActiveDeviceLinkForUpdate(String pairingCode, Instant now);

    // ---- re-authentication ----

    /** Saves a re-authentication request (insert or update). */
    void saveStepUp(StepUpRequest request);

    /** Like {@link #findApprovableStepUp} but row-locked: of concurrent approve/deny calls only one wins. */
    Optional<StepUpRequest> findApprovableStepUpForUpdate(String approvalCode, UUID identityId, UUID notSessionId, Instant now);

    /** A request that can be approved: right code, right identity, pending, not expired, and requested by ANOTHER session (read without a lock). */
    Optional<StepUpRequest> findApprovableStepUp(String approvalCode, UUID identityId, UUID notSessionId, Instant now);

    /** A request that was approved and is usable for exactly this session and action, not expired; row-locked so an approval is single-use. */
    Optional<StepUpRequest> findUsableStepUp(UUID id, UUID identityId, UUID sessionId, String operation, Instant now);
}
