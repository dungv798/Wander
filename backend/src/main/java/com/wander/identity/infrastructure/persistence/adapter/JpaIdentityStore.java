package com.wander.identity.infrastructure.persistence.adapter;

import com.wander.identity.domain.model.IdentityModel.CodeReplacement;
import com.wander.identity.domain.model.IdentityModel.DeviceLink;
import com.wander.identity.domain.model.IdentityModel.Identity;
import com.wander.identity.domain.model.IdentityModel.RecoveryAttempt;
import com.wander.identity.domain.model.IdentityModel.RecoveryCode;
import com.wander.identity.domain.model.IdentityModel.Session;
import com.wander.identity.domain.model.IdentityModel.StepUpRequest;
import com.wander.identity.domain.port.IdentityStore;
import com.wander.identity.infrastructure.persistence.constant.IdentityPersistenceConstants;
import com.wander.identity.infrastructure.persistence.entity.CodeReplacementEntity;
import com.wander.identity.infrastructure.persistence.entity.DeviceLinkEntity;
import com.wander.identity.infrastructure.persistence.entity.IdentityEntity;
import com.wander.identity.infrastructure.persistence.entity.RecoveryAttemptEntity;
import com.wander.identity.infrastructure.persistence.entity.RecoveryCodeEntity;
import com.wander.identity.infrastructure.persistence.entity.SessionEntity;
import com.wander.identity.infrastructure.persistence.entity.StepUpRequestEntity;
import com.wander.identity.infrastructure.persistence.mapper.IdentityMapper;
import com.wander.identity.infrastructure.persistence.repository.CodeReplacementJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.DeviceLinkJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.IdentityJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.RecoveryAttemptJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.RecoveryCodeJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.SessionJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.StepUpJpaRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

/**
 * Adapter cài đặt cổng {@link IdentityStore} bằng Spring Data JPA; không có quy tắc nghiệp vụ. Ánh xạ entity ↔ domain
 * do {@link IdentityMapper} (MapStruct, ADR-008) sinh; adapter chỉ quyết định nạp entity có sẵn hay tạo mới.
 */
@Repository
class JpaIdentityStore implements IdentityStore {

    private static final String PENDING = IdentityPersistenceConstants.STATE_PENDING;

    private final IdentityJpaRepository identities;
    private final SessionJpaRepository sessions;
    private final RecoveryCodeJpaRepository codes;
    private final RecoveryAttemptJpaRepository attempts;
    private final CodeReplacementJpaRepository replacements;
    private final DeviceLinkJpaRepository links;
    private final StepUpJpaRepository stepUps;
    private final IdentityMapper mapper;

    JpaIdentityStore(IdentityJpaRepository identities, SessionJpaRepository sessions,
                     RecoveryCodeJpaRepository codes, RecoveryAttemptJpaRepository attempts,
                     CodeReplacementJpaRepository replacements, DeviceLinkJpaRepository links,
                     StepUpJpaRepository stepUps, IdentityMapper mapper) {
        this.identities = identities;
        this.sessions = sessions;
        this.codes = codes;
        this.attempts = attempts;
        this.replacements = replacements;
        this.links = links;
        this.stepUps = stepUps;
        this.mapper = mapper;
    }

    // ---- danh tính, phiên ----

    @Override
    public void addIdentity(Identity identity) {
        IdentityEntity e = new IdentityEntity();
        mapper.update(identity, e);
        identities.save(e);
    }

    @Override
    public void addSession(Session s) {
        SessionEntity e = new SessionEntity();
        mapper.update(s, e);
        sessions.save(e);
    }

    @Override
    public Optional<Session> findSessionByTokenHash(String tokenHash) {
        return sessions.findByTokenHash(tokenHash).map(e -> mapper.toDomain(e));
    }

    @Override
    public void touchSession(UUID sessionId, Instant now) {
        sessions.touch(sessionId, now);
    }

    @Override
    public List<Session> activeSessions(UUID identityId) {
        return sessions.findByIdentityIdAndRevokedAtIsNull(identityId).stream()
                .map(e -> mapper.toDomain(e))
                .sorted(Comparator.comparing(Session::createdAt).thenComparing(s -> s.id().toString()))
                .toList();
    }

    @Override
    public Optional<Session> findActiveSession(UUID sessionId, UUID identityId) {
        return sessions.findByIdAndIdentityIdAndRevokedAtIsNull(sessionId, identityId).map(e -> mapper.toDomain(e));
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
        return codes.findByCodeHashAndInvalidatedAtIsNull(codeHash).map(e -> mapper.toDomain(e));
    }

    @Override
    public Optional<RecoveryCode> findActiveCode(UUID identityId) {
        return codes.findByIdentityIdAndInvalidatedAtIsNull(identityId).map(e -> mapper.toDomain(e));
    }

    @Override
    public Optional<RecoveryCode> findCodeForUpdate(UUID codeId) {
        return codes.lockById(codeId).map(e -> mapper.toDomain(e));
    }

    // ---- lần thử khôi phục ----

    @Override
    public Optional<RecoveryAttempt> findAttemptForUpdate(String attemptKey) {
        return attempts.lockByAttemptKey(attemptKey).map(e -> mapper.toDomain(e));
    }

    @Override
    public void saveAttempt(RecoveryAttempt a) {
        RecoveryAttemptEntity e = attempts.findById(a.id()).orElseGet(RecoveryAttemptEntity::new);
        mapper.update(a, e);
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
        mapper.update(r, e);
        replacements.save(e);
    }

    @Override
    public Optional<CodeReplacement> findPendingReplacement(UUID id, UUID identityId) {
        return replacements.findByIdAndIdentityIdAndState(id, identityId, PENDING).map(e -> mapper.toDomain(e));
    }

    // ---- ghép thiết bị ----

    @Override
    public boolean isPairingCodeActive(String pairingCode, Instant now) {
        return links.existsByPairingCodeAndStateAndExpiresAtAfter(pairingCode, PENDING, now);
    }

    @Override
    public void saveDeviceLink(DeviceLink d) {
        DeviceLinkEntity e = links.findById(d.id()).orElseGet(DeviceLinkEntity::new);
        mapper.update(d, e);
        links.save(e);
    }

    @Override
    public Optional<DeviceLink> findDeviceLink(UUID id) {
        return links.findById(id).map(e -> mapper.toDomain(e));
    }

    @Override
    public Optional<DeviceLink> findActiveDeviceLinkForUpdate(String pairingCode, Instant now) {
        return links.lockActiveByPairingCode(pairingCode, now).stream().findFirst().map(e -> mapper.toDomain(e));
    }

    // ---- xác thực lại ----

    @Override
    public void saveStepUp(StepUpRequest r) {
        StepUpRequestEntity e = stepUps.findById(r.id()).orElseGet(StepUpRequestEntity::new);
        mapper.update(r, e);
        stepUps.save(e);
    }

    @Override
    public Optional<StepUpRequest> findApprovableStepUp(String approvalCode, UUID identityId, UUID notSessionId, Instant now) {
        return stepUps.findApprovable(approvalCode, identityId, notSessionId, now).stream().findFirst().map(e -> mapper.toDomain(e));
    }

    @Override
    public Optional<StepUpRequest> findUsableStepUp(UUID id, UUID identityId, UUID sessionId, String operation, Instant now) {
        return stepUps.findUsable(id, identityId, sessionId, operation, now).map(e -> mapper.toDomain(e));
    }

    /** Entity mới mang giá trị của mã khôi phục domain (id trùng id cũ thì lưu sẽ ghi đè dòng cũ). */
    private RecoveryCodeEntity toEntity(RecoveryCode code) {
        RecoveryCodeEntity entity = new RecoveryCodeEntity();
        mapper.update(code, entity);
        return entity;
    }
}
