package com.wander.identity.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StepUpJpaRepository extends JpaRepository<StepUpRequestEntity, UUID> {
    @Query("""
            select r from StepUpRequestEntity r
            where r.approvalCode = :code and r.identityId = :identity and r.sessionId <> :session
              and r.state = 'pending' and r.expiresAt > :now""")
    List<StepUpRequestEntity> findApprovable(@Param("code") String code, @Param("identity") UUID identity,
                                             @Param("session") UUID notSession, @Param("now") Instant now);

    @Query("""
            select r from StepUpRequestEntity r
            where r.id = :id and r.identityId = :identity and r.sessionId = :session and r.operation = :op
              and r.state = 'approved' and r.expiresAt > :now""")
    Optional<StepUpRequestEntity> findUsable(@Param("id") UUID id, @Param("identity") UUID identity,
                                             @Param("session") UUID session, @Param("op") String op,
                                             @Param("now") Instant now);
}
