package com.wander.identity.application.service;

import com.wander.identity.application.input.EvidenceInput;
import com.wander.identity.application.input.IdentityFields;
import com.wander.identity.application.input.IdentityInput;
import com.wander.identity.application.view.IdentityViews.Approved;
import com.wander.identity.application.view.IdentityViews.Committed;
import com.wander.identity.application.view.IdentityViews.Denied;
import com.wander.identity.application.view.IdentityViews.RecoveryStarted;
import com.wander.identity.application.view.IdentityViews.ReplacementBegun;
import com.wander.identity.application.view.IdentityViews.StepUpCreated;
import com.wander.identity.application.view.IdentityViews.StepUpPreview;
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
import com.wander.identity.domain.port.RecoveryCodeHasher;
import com.wander.identity.domain.rule.MatchChallenge;
import com.wander.identity.domain.rule.Secrets;
import com.wander.identity.domain.vocabulary.EventKind;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.security.AuthenticatedPrincipal;
import com.wander.shared.kernel.util.Ids;
import com.wander.shared.kernel.util.Timestamps;
import java.time.Clock;
import java.time.Instant;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Recovery of ownership following D20-D26 and the design draft docs/autopilot/q16-design-draft.md (archived, see the git tag pre-portfolio-cleanup).
 * <b>RELEASE GATE RG-1:</b> the design has not been approved by the Product Owner; do not release to real users.
 * The defaults MĐ-1...MĐ-8 are PROPOSED; the code follows them closely and will change with the review outcome.
 * <p>
 * Every public method is one transaction. Throwing an error => the whole transaction rolls back (including marking something expired before the throw),
 * like the old implementation.
 */
@Service
@Transactional
public class RecoveryService {

    private final IdentityStore store;
    private final Clock clock;
    private final RecoveryCodeHasher hasher;
    private final SecurityEventService events;

    /** Takes the storage port, the clock (tests replace it with a fake), the keyed recovery-code hasher and the security event log. */
    public RecoveryService(IdentityStore store, Clock clock, RecoveryCodeHasher hasher, SecurityEventService events) {
        this.store = store;
        this.clock = clock;
        this.hasher = hasher;
        this.events = events;
    }

    // ---------- Recovery with a code (KP-C, D24) ----------

    /**
     * Steps 1-2: check the current code, create a pending attempt and issue the replacement code (not valid yet).
     * The old code is NOT consumed yet; no session has been created (INV-15).
     */
    public RecoveryStarted startRecovery(String attemptId, String sessionToken, String deviceNameRaw, String code) {
        String attemptKey = IdentityInput.attemptKey(attemptId);
        String tokenHash = Secrets.hashToken(IdentityInput.sessionToken(sessionToken));
        String deviceName = IdentityInput.deviceName(deviceNameRaw);
        String normalized = Secrets.normalize(code, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null) throw invalidCode();

        RecoveryCode oldCode = findActiveCode(normalized).orElseThrow(RecoveryService::invalidCode);
        store.lockIdentity(oldCode.identityId());
        oldCode = store.findCodeForUpdate(oldCode.id()).filter(RecoveryCode::isActive).orElseThrow(RecoveryService::invalidCode);
        String replacement = Secrets.newRecoveryCode();
        String replacementHash = hasher.hashDisplayed(replacement);
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.PENDING_TTL);

        Optional<RecoveryAttempt> existing = store.findAttemptForUpdate(attemptKey);
        if (existing.isPresent()) {
            store.saveAttempt(restartedAttempt(existing.get(), oldCode, tokenHash, replacementHash, expiresAt, deviceName));
        } else {
            if (store.isTokenHashInUse(tokenHash)) throw IdentityInput.tokenInUse();
            store.saveAttempt(new RecoveryAttempt(UUID.randomUUID(), attemptKey, oldCode.identityId(), oldCode.id(), replacementHash,
                    tokenHash, AttemptState.PENDING, now, expiresAt, deviceName, hasher.currentKeyVersion()));
        }
        return new RecoveryStarted(attemptKey, replacement, Timestamps.format(expiresAt));
    }

    /**
     * Steps 3-4: the owner types the replacement code again, then an atomic commit: invalidate the old code + activate the replacement + create a session (INV-11).
     * No other session is revoked (D23, INV-10). Calling again after the commit with the same attempt is idempotent (INV-12).
     */
    public Committed completeRecovery(String attemptId, String replacementCode) {
        String attemptKey = IdentityInput.attemptKey(attemptId);
        String normalized = Secrets.normalize(replacementCode, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null) throw invalidReplacement();
        RecoveryAttempt metadata = store.findAttempt(attemptKey).orElseThrow(RecoveryService::invalidCode);
        store.lockIdentity(metadata.identityId());
        RecoveryAttempt attempt = store.findAttemptForUpdate(attemptKey).orElseThrow(RecoveryService::invalidCode);
        if (!hasher.matches(normalized, attempt.replacementHash(), attempt.keyVersion())) throw invalidReplacement();
        if (attempt.state() == AttemptState.COMMITTED) return Committed.YES;
        if (attempt.state() != AttemptState.PENDING) throw invalidCode();
        Instant now = Timestamps.now(clock);
        if (attempt.isExpired(now)) {
            throw WanderException.invalid(IdentityErrorCodes.ATTEMPT_EXPIRED, IdentityMessages.RECOVERY_EXPIRED, null);
        }
        // Row lock on the old code: two concurrent attempts with the same code => exactly one commit (INV-7).
        RecoveryCode oldCode = store.findCodeForUpdate(attempt.oldCodeId()).filter(RecoveryCode::isActive)
                .orElseThrow(() -> WanderException.conflict(IdentityErrorCodes.CODE_ALREADY_USED, IdentityMessages.CODE_ALREADY_USED));
        store.invalidateRecoveryCode(oldCode.invalidate(IdentityConstants.INVALIDATED_BY_RECOVERY, now));
        store.addRecoveryCode(RecoveryCode.issue(attempt.identityId(), attempt.replacementHash(), now, attempt.keyVersion()));
        store.addSession(Session.open(attempt.identityId(), attempt.sessionTokenHash(), attempt.deviceName(), now));
        store.saveAttempt(attempt.withState(AttemptState.COMMITTED));
        events.record(attempt.identityId(), EventKind.RECOVERED, attempt.deviceName());
        return Committed.YES;
    }

    // ---------- First issue and regeneration of the code from a valid session (two phases; D23, D25, MĐ-2) ----------

    /**
     * Phase 1: create the pending replacement code. The current code (if any) stays valid until phase 2 commits (INV-13).
     * When there is a current code, re-authentication is required: present the current code, or an approval from another device.
     */
    public ReplacementBegun beginReplacement(AuthenticatedPrincipal principal, EvidenceInput evidence) {
        store.lockIdentity(principal.identityId());
        Optional<RecoveryCode> current = store.findActiveCode(principal.identityId());
        current.ifPresent(code -> requireStepUpEvidence(principal, evidence, code));
        // At any moment there is only one pending replacement code.
        store.voidPendingReplacements(principal.identityId());
        String replacement = Secrets.newRecoveryCode();
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.PENDING_TTL);
        UUID id = UUID.randomUUID();
        store.saveReplacement(new CodeReplacement(id, principal.identityId(), principal.sessionId(),
                current.map(RecoveryCode::id).orElse(null), hasher.hashDisplayed(replacement),
                ReplacementState.PENDING, now, expiresAt, hasher.currentKeyVersion()));
        return new ReplacementBegun(id.toString(), replacement, Timestamps.format(expiresAt));
    }

    /** Phase 2: the owner types the replacement code again; the commit invalidates the old code and activates the new one in one transaction. */
    public Committed confirmReplacement(AuthenticatedPrincipal principal, String pendingId, String replacementCode) {
        store.lockIdentity(principal.identityId());
        String normalized = Secrets.normalize(replacementCode, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null || pendingId == null) throw invalidReplacement();
        CodeReplacement replacement = Ids.parse(pendingId)
                .flatMap(id -> store.findPendingReplacement(id, principal.identityId()))
                .orElseThrow(() -> WanderException.notFound(IdentityMessages.NO_PENDING_REPLACEMENT));
        Instant now = Timestamps.now(clock);
        if (replacement.isExpired(now)) {
            throw WanderException.invalid(IdentityErrorCodes.ATTEMPT_EXPIRED, IdentityMessages.REPLACEMENT_EXPIRED, null);
        }
        if (!hasher.matches(normalized, replacement.replacementHash(), replacement.keyVersion())) throw invalidReplacement();
        Optional<RecoveryCode> current = store.findActiveCode(principal.identityId());
        if (!Objects.equals(current.map(RecoveryCode::id).orElse(null), replacement.oldCodeId())) {
            throw WanderException.conflict(IdentityErrorCodes.CODE_CHANGED, IdentityMessages.CODE_CHANGED);
        }
        current.ifPresent(code -> store.invalidateRecoveryCode(code.invalidate(IdentityConstants.INVALIDATED_BY_REPLACEMENT, now)));
        store.addRecoveryCode(RecoveryCode.issue(principal.identityId(), replacement.replacementHash(), now, replacement.keyVersion()));
        store.saveReplacement(replacement.withState(ReplacementState.COMMITTED));
        events.record(principal.identityId(), EventKind.CODE, null);
        return Committed.YES;
    }

    // ---------- Re-authentication by approval from another trusted device (D25, MĐ-1) ----------

    /** Asks for a re-authentication approval for a sensitive action; returns a short code for the other device to type. */
    public StepUpCreated requestStepUp(AuthenticatedPrincipal principal, String operation) {
        if (operation == null || !IdentityConstants.STEP_UP_OPERATIONS.contains(operation)) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_OPERATION, IdentityMessages.INVALID_OPERATION, IdentityFields.OPERATION);
        }
        Instant now = Timestamps.now(clock);
        Instant expiresAt = now.plus(IdentityConstants.APPROVAL_TTL);
        UUID id = UUID.randomUUID();
        String approvalCode = Secrets.newShortCode();
        MatchChallenge challenge = MatchChallenge.random();
        store.saveStepUp(new StepUpRequest(id, principal.identityId(), principal.sessionId(), operation, approvalCode,
                StepUpState.PENDING, null, now, expiresAt, challenge.number(), challenge.optionsText()));
        return new StepUpCreated(id.toString(), approvalCode, challenge.number(), Timestamps.format(expiresAt));
    }

    /**
     * The approving device previews the re-authentication request (DR-018 E1): the action, the requesting device name (self-declared, unverified), the time and the
     * matching-number choices fixed at creation. Changes no state.
     */
    public StepUpPreview previewStepUp(AuthenticatedPrincipal principal, String approvalCode) {
        StepUpRequest request = findApprovableStepUp(principal, approvalCode, false);
        String requesterName = store.findActiveSession(request.sessionId(), principal.identityId()).map(Session::deviceName).orElse(null);
        return new StepUpPreview(request.id().toString(), request.operation(), requesterName, Timestamps.format(request.createdAt()),
                request.challenge().options());
    }

    /** The approving device actively denies: the request becomes denied and can never be approved again. */
    public Denied denyStepUp(AuthenticatedPrincipal principal, String approvalCode) {
        store.saveStepUp(findApprovableStepUp(principal, approvalCode, true).deny());
        return Denied.YES;
    }

    /**
     * Must be approved by ANOTHER session of the same identity, by CHOOSING THE RIGHT MATCHING NUMBER: the requesting session cannot approve itself.
     * A wrong choice => the request is denied for good (kept even though an error is thrown, hence {@code noRollbackFor}). A missing or malformed number is rejected
     * before the request is touched. NOTE: any {@code WanderException} added to
     * this method AFTER the write would commit half the work; only throw before writing or right after the denying write.
     */
    @Transactional(noRollbackFor = WanderException.class)
    public Approved approveStepUp(AuthenticatedPrincipal principal, String approvalCode, Integer number) {
        int chosen = IdentityInput.matchNumber(number);
        StepUpRequest request = findApprovableStepUp(principal, approvalCode, true);
        if (!request.challenge().matches(chosen)) {
            store.saveStepUp(request.deny());
            throw WanderException.forbidden(IdentityErrorCodes.MATCH_MISMATCH, IdentityMessages.MATCH_MISMATCH);
        }
        store.saveStepUp(request.approve(principal.sessionId()));
        return Approved.YES;
    }

    /**
     * The re-authentication request that is pending, still valid, of the right identity and requested by ANOTHER session; {@code lock} = row lock (approve/deny, so
     * only one concurrent attempt wins) or a plain read (preview). Wrong code => INVALID_APPROVAL_CODE.
     */
    private StepUpRequest findApprovableStepUp(AuthenticatedPrincipal principal, String approvalCodeRaw, boolean lock) {
        String code = Secrets.normalize(approvalCodeRaw, IdentityConstants.SHORT_CODE_SYMBOLS);
        if (code == null) throw invalidApprovalCode();
        String approvalCode = Secrets.formatShort(code);
        Instant now = Timestamps.now(clock);
        return (lock ? store.findApprovableStepUpForUpdate(approvalCode, principal.identityId(), principal.sessionId(), now)
                : store.findApprovableStepUp(approvalCode, principal.identityId(), principal.sessionId(), now))
                .orElseThrow(RecoveryService::invalidApprovalCode);
    }

    // ---------- helpers ----------

    /** Valid re-authentication evidence (present the current code or an approval from another device) is required before creating a new code. */
    private void requireStepUpEvidence(AuthenticatedPrincipal principal, EvidenceInput evidence, RecoveryCode current) {
        WanderException denied = WanderException.forbidden(IdentityErrorCodes.STEP_UP_REQUIRED, IdentityMessages.STEP_UP_REQUIRED_FOR_NEW_CODE);
        if (evidence == null) throw denied;
        String type = evidence.type();
        if (IdentityFields.EVIDENCE_TYPE_CODE.equals(type)) {
            requireMatchesCurrentCode(evidence.code(), current, denied);
        } else if (IdentityFields.EVIDENCE_TYPE_APPROVAL.equals(type)) {
            consumeStepUp(principal, evidence.requestId(), IdentityConstants.OPERATION_REGENERATE_CODE);
        } else {
            throw denied;
        }
    }

    /** The code the user presents must match the current recovery code; otherwise throw {@code denied}. */
    private void requireMatchesCurrentCode(String typedCode, RecoveryCode current, WanderException denied) {
        String normalized = Secrets.normalize(typedCode, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        if (normalized == null || !hasher.matches(normalized, current.codeHash(), current.keyVersion())) throw denied;
    }

    /** Uses (once) an approval that was approved for exactly this session and action; none available => throws STEP_UP_REQUIRED. */
    private void consumeStepUp(AuthenticatedPrincipal principal, String requestId, String operation) {
        WanderException denied = WanderException.forbidden(IdentityErrorCodes.STEP_UP_REQUIRED, IdentityMessages.STEP_UP_REQUIRED);
        if (requestId == null) throw denied;
        StepUpRequest request = Ids.parse(requestId)
                .flatMap(id -> store.findUsableStepUp(id, principal.identityId(), principal.sessionId(), operation, Timestamps.now(clock)))
                .orElseThrow(() -> denied);
        store.saveStepUp(request.consume());
    }

    /** An existing attempt may be restarted, but only by the party that created it (same code, same session secret) and while it is pending (MĐ-6). */
    private RecoveryAttempt restartedAttempt(RecoveryAttempt attempt, RecoveryCode oldCode, String tokenHash,
                                                    String replacementHash, Instant expiresAt, String deviceName) {
        boolean sameOwner = attempt.state() == AttemptState.PENDING
                && attempt.oldCodeId().equals(oldCode.id())
                && attempt.sessionTokenHash().equals(tokenHash);
        if (!sameOwner) throw invalidCode();
        return attempt.restart(replacementHash, expiresAt, deviceName, hasher.currentKeyVersion());
    }

    /** Looks the code up with each key still supported, checking the metadata as well so a key label is never confused. */
    private Optional<RecoveryCode> findActiveCode(String normalized) {
        return hasher.keyVersions().stream().flatMap(version -> hasher.hashWithVersion(normalized, version)
                .flatMap(store::findActiveCodeByHash).filter(code -> version.equals(code.keyVersion())).stream()).findFirst();
    }

    /** Error: the recovery code is wrong or has already been used. */
    private static WanderException invalidCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_CODE, IdentityMessages.INVALID_CODE, null);
    }

    /** Error: the replacement code typed again is wrong. */
    private static WanderException invalidReplacement() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_REPLACEMENT, IdentityMessages.INVALID_REPLACEMENT, null);
    }

    /** Error: the approval code is wrong or expired. */
    private static WanderException invalidApprovalCode() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_APPROVAL_CODE, IdentityMessages.INVALID_APPROVAL_CODE, null);
    }
}
