package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryKeyCheckEntity;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the recovery-key fingerprint table (the primary key is the key label). */
public interface RecoveryKeyCheckJpaRepository extends JpaRepository<RecoveryKeyCheckEntity, String> {

    /** Records the fingerprint if the label is not there yet (safe when two instances start at the same time); returns the rows written, 0 means it already existed. */
    @Modifying(clearAutomatically = true)
    @Query(value = IdentityQueryConstants.INSERT_KEY_CHECK_IF_ABSENT, nativeQuery = true)
    int insertIfAbsent(@Param("version") String version, @Param("fingerprint") String fingerprint, @Param("now") Instant now);
}
