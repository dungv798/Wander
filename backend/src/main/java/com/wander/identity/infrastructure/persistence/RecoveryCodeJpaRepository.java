package com.wander.identity.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecoveryCodeJpaRepository extends JpaRepository<RecoveryCodeEntity, UUID> {
    Optional<RecoveryCodeEntity> findByCodeHashAndInvalidatedAtIsNull(String codeHash);

    Optional<RecoveryCodeEntity> findByIdentityIdAndInvalidatedAtIsNull(UUID identityId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from RecoveryCodeEntity c where c.id = :id")
    Optional<RecoveryCodeEntity> lockById(@Param("id") UUID id);
}
