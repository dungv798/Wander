package com.wander.identity.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecoveryAttemptJpaRepository extends JpaRepository<RecoveryAttemptEntity, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from RecoveryAttemptEntity a where a.attemptKey = :key")
    Optional<RecoveryAttemptEntity> lockByAttemptKey(@Param("key") String key);

    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);
}
