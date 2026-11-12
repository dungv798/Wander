package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.IdentityEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository (queries derived from names, @Query JPQL, @Lock = SELECT ... FOR UPDATE). */
public interface IdentityJpaRepository extends JpaRepository<IdentityEntity, UUID> {

    /** Locks the identity before any code change so recovery and regeneration do not overwrite each other. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.IDENTITY_BY_ID)
    Optional<IdentityEntity> lockById(@Param("id") UUID id);
}
