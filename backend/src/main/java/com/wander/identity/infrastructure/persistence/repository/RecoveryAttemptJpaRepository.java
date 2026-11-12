package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryAttemptEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the recovery-attempt table. */
public interface RecoveryAttemptJpaRepository extends JpaRepository<RecoveryAttemptEntity, UUID> {

    /** Reads the metadata before locking the identity; do not use this result to commit. */
    Optional<RecoveryAttemptEntity> findByAttemptKey(String attemptKey);

    /** The attempt by its id with a write lock (SELECT ... FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.ATTEMPT_BY_KEY)
    Optional<RecoveryAttemptEntity> lockByAttemptKey(@Param("key") String key);

    /** Whether an attempt holds this secret hash in the given state. */
    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);
}
