package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.SessionEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the session table. */
public interface SessionJpaRepository extends JpaRepository<SessionEntity, UUID> {

    /** The session by secret hash. */
    Optional<SessionEntity> findByTokenHash(String tokenHash);

    /** Whether the secret hash already belongs to some session (even a revoked one). */
    boolean existsByTokenHash(String tokenHash);

    /** The identity's sessions that are not revoked. */
    List<SessionEntity> findByIdentityIdAndRevokedAtIsNull(UUID identityId);

    /** A session that is not revoked, by id, of exactly this identity. */
    Optional<SessionEntity> findByIdAndIdentityIdAndRevokedAtIsNull(UUID id, UUID identityId);

    /** Records the time the session was last used. */
    @Modifying
    @Query(IdentityQueryConstants.TOUCH_SESSION)
    void touch(@Param("id") UUID id, @Param("now") Instant now);

    /** Sets or clears the device name of a session that is not revoked. */
    @Modifying
    @Query(IdentityQueryConstants.RENAME_SESSION)
    void rename(@Param("id") UUID id, @Param("name") String name);

    /** Revokes the session if it is not already revoked. */
    @Modifying
    @Query(IdentityQueryConstants.REVOKE_SESSION)
    void revoke(@Param("id") UUID id, @Param("now") Instant now);
}
