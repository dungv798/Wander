package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryCodeEntity;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the recovery-code table. */
public interface RecoveryCodeJpaRepository extends JpaRepository<RecoveryCodeEntity, UUID> {

    /** Non-secret metadata of the keys that must not yet be dropped from the deployment configuration. */
    @Query(value = IdentityQueryConstants.REQUIRED_RECOVERY_KEY_VERSIONS, nativeQuery = true)
    List<String> findRequiredKeyVersions();

    /** The code that is still valid, by hash. */
    Optional<RecoveryCodeEntity> findByCodeHashAndInvalidatedAtIsNull(String codeHash);

    /** The identity's code that is still valid. */
    Optional<RecoveryCodeEntity> findByIdentityIdAndInvalidatedAtIsNull(UUID identityId);

    /** The code by id with a write lock (SELECT ... FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.RECOVERY_CODE_BY_ID)
    Optional<RecoveryCodeEntity> lockById(@Param("id") UUID id);
}
