package com.wander.identity.infrastructure.persistence;

import com.wander.identity.domain.IdentityModel.AttemptState;
import com.wander.identity.domain.IdentityModel.CodeReplacement;
import com.wander.identity.domain.IdentityModel.DeviceLink;
import com.wander.identity.domain.IdentityModel.Identity;
import com.wander.identity.domain.IdentityModel.LinkState;
import com.wander.identity.domain.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.IdentityModel.RecoveryCode;
import com.wander.identity.domain.IdentityModel.ReplacementState;
import com.wander.identity.domain.IdentityModel.Session;
import com.wander.identity.domain.IdentityModel.StepUpRequest;
import com.wander.identity.domain.IdentityModel.StepUpState;
import com.wander.identity.domain.IdentityStore;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/** Adapter cài đặt cổng {@link IdentityStore} bằng Spring Data JPA; chỉ làm ánh xạ, không có quy tắc nghiệp vụ. */
@Repository
class JpaIdentityStore implements IdentityStore {

    private static final String PENDING = "pending";

    private final IdentityJpaRepository identities;
    private final SessionJpaRepository sessions;
    private final RecoveryCodeJpaRepository codes;
    private final RecoveryAttemptJpaRepository attempts;
    private final CodeReplacementJpaRepository replacements;
    private final DeviceLinkJpaRepository links;
    private final StepUpJpaRepository stepUps;

    JpaIdentityStore(IdentityJpaRepository identities, SessionJpaRepository sessions,
                     RecoveryCodeJpaRepository codes, RecoveryAttemptJpaRepository attempts,
                     CodeReplacementJpaRepository replacements, DeviceLinkJpaRepository links,
                     StepUpJpaRepository stepUps) {
        this.identities = identities;
        this.sessions = sessions;
        this.codes = codes;
        this.attempts = attempts;
        this.replacements = replacements;
        this.links = links;
        this.stepUps = stepUps;
    }

    // ---- danh tính, phiên ----

    @Override
    public void addIdentity(Identity identity) {
        IdentityEntity e = new IdentityEntity();
        e.setId(identity.id());
        e.setCreatedAt(identity.createdAt());
        identities.save(e);
    }

    @Override
    public void addSession(Session s) {
        SessionEntity e = new SessionEntity();
        e.setId(s.id());
        e.setIdentityId(s.identityId());
        e.setTokenHash(s.tokenHash());
        e.setCreatedAt(s.createdAt());
        e.setLastSeenAt(s.lastSeenAt());
        e.setRevokedAt(s.revokedAt());
        sessions.save(e);
    }

    @Override
    public Optional<Session> findSessionByTokenHash(String tokenHash) {
        return sessions.findByTokenHash(tokenHash).map(JpaIdentityStore::toDomain);
    }

    @Override
    public void touchSession(UUID sessionId, Instant now) {
        sessions.touch(sessionId, now);
    }

    @Override
    public List<Session> activeSessions(UUID identityId) {
        return sessions.findByIdentityIdAndRevokedAtIsNull(identityId).stream()
                .map(JpaIdentityStore::toDomain)
                .sorted(Comparator.comparing(Session::createdAt).thenComparing(s -> s.id().toString()))
                .toList();
    }

    @Override
    public Optional<Session> findActiveSession(UUID sessionId, UUID identityId) {
        return sessions.findByIdAndIdentityIdAndRevokedAtIsNull(sessionId, identityId).map(JpaIdentityStore::toDomain);
    }

    @Override
    public void revokeSession(UUID sessionId, Instant now) {
        sessions.revoke(sessionId, now);
    }

    @Override
    public boolean isTokenHashInUse(String tokenHash) {
        return sessions.existsByTokenHash(tokenHash)
                || attempts.existsBySessionTokenHashAndState(tokenHash, PENDING)
                || links.existsBySessionTokenHashAndState(tokenHash, PENDING);
    }

    // ---- mã khôi phục ----

    @Override
    public void addRecoveryCode(RecoveryCode c) {
        codes.save(toEntity(c));
    }

    @Override
    public void invalidateRecoveryCode(RecoveryCode invalidated) {
        // Flush ngay: Hibernate mặc định chạy INSERT trước UPDATE khi flush, sẽ vi phạm chỉ mục
        // "một mã hợp lệ cho mỗi danh tính" nếu mã mới được chèn trước khi mã cũ bị vô hiệu.
        codes.saveAndFlush(toEntity(invalidated));
    }

    @Override
    public Optional<RecoveryCode> findActiveCodeByHash(String codeHash) {
        return codes.findByCodeHashAndInvalidatedAtIsNull(codeHash).map(JpaIdentityStore::toDomain);
    }

    @Override
    public Optional<RecoveryCode> findActiveCode(UUID identityId) {
        return codes.findByIdentityIdAndInvalidatedAtIsNull(identityId).map(JpaIdentityStore::toDomain);
    }

    @Override
    public Optional<RecoveryCode> findCodeForUpdate(UUID codeId) {
        return codes.lockById(codeId).map(JpaIdentityStore::toDomain);
    }

    // ---- lần thử khôi phục ----

    @Override
    public Optional<RecoveryAttempt> findAttemptForUpdate(String attemptKey) {
        return attempts.lockByAttemptKey(attemptKey).map(e -> new RecoveryAttempt(e.getId(), e.getAttemptKey(), e.getIdentityId(),
                e.getOldCodeId(), e.getReplacementHash(), e.getSessionTokenHash(), state(AttemptState.class, e.getState()),
                e.getCreatedAt(), e.getExpiresAt()));
    }

    @Override
    public void saveAttempt(RecoveryAttempt a) {
        RecoveryAttemptEntity e = attempts.findById(a.id()).orElseGet(RecoveryAttemptEntity::new);
        e.setId(a.id());
        e.setAttemptKey(a.attemptKey());
        e.setIdentityId(a.identityId());
        e.setOldCodeId(a.oldCodeId());
        e.setReplacementHash(a.replacementHash());
        e.setSessionTokenHash(a.sessionTokenHash());
        e.setState(text(a.state()));
        e.setCreatedAt(a.createdAt());
        e.setExpiresAt(a.expiresAt());
        attempts.save(e);
    }

    // ---- tái tạo mã ----

    @Override
    public void voidPendingReplacements(UUID identityId) {
        replacements.voidPending(identityId);
    }

    @Override
    public void saveReplacement(CodeReplacement r) {
        CodeReplacementEntity e = replacements.findById(r.id()).orElseGet(CodeReplacementEntity::new);
        e.setId(r.id());
        e.setIdentityId(r.identityId());
        e.setSessionId(r.sessionId());
        e.setOldCodeId(r.oldCodeId());
        e.setReplacementHash(r.replacementHash());
        e.setState(text(r.state()));
        e.setCreatedAt(r.createdAt());
        e.setExpiresAt(r.expiresAt());
        replacements.save(e);
    }

    @Override
    public Optional<CodeReplacement> findPendingReplacement(UUID id, UUID identityId) {
        return replacements.findByIdAndIdentityIdAndState(id, identityId, PENDING).map(e -> new CodeReplacement(e.getId(),
                e.getIdentityId(), e.getSessionId(), e.getOldCodeId(), e.getReplacementHash(),
                state(ReplacementState.class, e.getState()), e.getCreatedAt(), e.getExpiresAt()));
    }

    // ---- ghép thiết bị ----

    @Override
    public boolean isPairingCodeActive(String pairingCode, Instant now) {
        return links.existsByPairingCodeAndStateAndExpiresAtAfter(pairingCode, PENDING, now);
    }

    @Override
    public void saveDeviceLink(DeviceLink d) {
        DeviceLinkEntity e = links.findById(d.id()).orElseGet(DeviceLinkEntity::new);
        e.setId(d.id());
        e.setPairingCode(d.pairingCode());
        e.setSessionTokenHash(d.sessionTokenHash());
        e.setState(text(d.state()));
        e.setIdentityId(d.identityId());
        e.setCreatedAt(d.createdAt());
        e.setExpiresAt(d.expiresAt());
        links.save(e);
    }

    @Override
    public Optional<DeviceLink> findDeviceLink(UUID id) {
        return links.findById(id).map(JpaIdentityStore::toDomain);
    }

    @Override
    public Optional<DeviceLink> findActiveDeviceLinkForUpdate(String pairingCode, Instant now) {
        return links.lockActiveByPairingCode(pairingCode, now).stream().findFirst().map(JpaIdentityStore::toDomain);
    }

    // ---- xác thực lại ----

    @Override
    public void saveStepUp(StepUpRequest r) {
        StepUpRequestEntity e = stepUps.findById(r.id()).orElseGet(StepUpRequestEntity::new);
        e.setId(r.id());
        e.setIdentityId(r.identityId());
        e.setSessionId(r.sessionId());
        e.setOperation(r.operation());
        e.setApprovalCode(r.approvalCode());
        e.setState(text(r.state()));
        e.setApprovedBySession(r.approvedBySession());
        e.setCreatedAt(r.createdAt());
        e.setExpiresAt(r.expiresAt());
        stepUps.save(e);
    }

    @Override
    public Optional<StepUpRequest> findApprovableStepUp(String approvalCode, UUID identityId, UUID notSessionId, Instant now) {
        return stepUps.findApprovable(approvalCode, identityId, notSessionId, now).stream().findFirst().map(JpaIdentityStore::toDomain);
    }

    @Override
    public Optional<StepUpRequest> findUsableStepUp(UUID id, UUID identityId, UUID sessionId, String operation, Instant now) {
        return stepUps.findUsable(id, identityId, sessionId, operation, now).map(JpaIdentityStore::toDomain);
    }

    // ---- ánh xạ ----

    private static Session toDomain(SessionEntity e) {
        return new Session(e.getId(), e.getIdentityId(), e.getTokenHash(), e.getCreatedAt(), e.getLastSeenAt(), e.getRevokedAt());
    }

    private static RecoveryCode toDomain(RecoveryCodeEntity e) {
        return new RecoveryCode(e.getId(), e.getIdentityId(), e.getCodeHash(), e.getCreatedAt(), e.getInvalidatedAt(), e.getInvalidatedReason());
    }

    private static RecoveryCodeEntity toEntity(RecoveryCode c) {
        RecoveryCodeEntity e = new RecoveryCodeEntity();
        e.setId(c.id());
        e.setIdentityId(c.identityId());
        e.setCodeHash(c.codeHash());
        e.setCreatedAt(c.createdAt());
        e.setInvalidatedAt(c.invalidatedAt());
        e.setInvalidatedReason(c.invalidatedReason());
        return e;
    }

    private static DeviceLink toDomain(DeviceLinkEntity e) {
        return new DeviceLink(e.getId(), e.getPairingCode(), e.getSessionTokenHash(), state(LinkState.class, e.getState()),
                e.getIdentityId(), e.getCreatedAt(), e.getExpiresAt());
    }

    private static StepUpRequest toDomain(StepUpRequestEntity e) {
        return new StepUpRequest(e.getId(), e.getIdentityId(), e.getSessionId(), e.getOperation(), e.getApprovalCode(),
                state(StepUpState.class, e.getState()), e.getApprovedBySession(), e.getCreatedAt(), e.getExpiresAt());
    }

    private static String text(Enum<?> state) {
        return state.name().toLowerCase(Locale.ROOT);
    }

    private static <E extends Enum<E>> E state(Class<E> type, String text) {
        return Enum.valueOf(type, text.toUpperCase(Locale.ROOT));
    }
}
