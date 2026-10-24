package com.wander.identity.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CodeReplacementJpaRepository extends JpaRepository<CodeReplacementEntity, UUID> {
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update CodeReplacementEntity r set r.state = 'void' where r.identityId = :identity and r.state = 'pending'")
    void voidPending(@Param("identity") UUID identityId);

    Optional<CodeReplacementEntity> findByIdAndIdentityIdAndState(UUID id, UUID identityId, String state);
}
