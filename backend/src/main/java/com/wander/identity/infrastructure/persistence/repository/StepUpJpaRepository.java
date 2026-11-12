package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.StepUpRequestEntity;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the re-authentication request table. */
public interface StepUpJpaRepository extends JpaRepository<StepUpRequestEntity, UUID> {

    /** A request that can be approved: right code, right identity, pending, not expired, and requested by ANOTHER session. */
    @Query(IdentityQueryConstants.APPROVABLE_STEP_UP)
    List<StepUpRequestEntity> findApprovable(@Param("code") String code, @Param("identity") UUID identity,
                                             @Param("session") UUID notSession, @Param("now") Instant now);

    /** Like {@link #findApprovable} but with a write lock (SELECT ... FOR UPDATE): of concurrent approve/deny calls only one wins. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.APPROVABLE_STEP_UP)
    List<StepUpRequestEntity> lockApprovable(@Param("code") String code, @Param("identity") UUID identity,
                                             @Param("session") UUID notSession, @Param("now") Instant now);

    /** A request that was approved and is usable for exactly this session and action, not expired; write-locked so it is used exactly once. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.USABLE_STEP_UP)
    Optional<StepUpRequestEntity> findUsable(@Param("id") UUID id, @Param("identity") UUID identity,
                                             @Param("session") UUID session, @Param("op") String op,
                                             @Param("now") Instant now);
}
