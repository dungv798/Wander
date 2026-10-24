package com.wander.identity.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SessionJpaRepository extends JpaRepository<SessionEntity, UUID> {
    Optional<SessionEntity> findByTokenHash(String tokenHash);

    boolean existsByTokenHash(String tokenHash);

    List<SessionEntity> findByIdentityIdAndRevokedAtIsNull(UUID identityId);

    Optional<SessionEntity> findByIdAndIdentityIdAndRevokedAtIsNull(UUID id, UUID identityId);

    @Modifying
    @Query("update SessionEntity s set s.lastSeenAt = :now where s.id = :id")
    void touch(@Param("id") UUID id, @Param("now") Instant now);

    @Modifying
    @Query("update SessionEntity s set s.revokedAt = :now where s.id = :id and s.revokedAt is null")
    void revoke(@Param("id") UUID id, @Param("now") Instant now);
}
