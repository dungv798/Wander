package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.CodeReplacementEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the replacement-code table. */
public interface CodeReplacementJpaRepository extends JpaRepository<CodeReplacementEntity, UUID> {

    /** Cancels every pending replacement code of the identity; flushes first and clears the persistence context after so the next query sees the result. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(IdentityQueryConstants.VOID_PENDING_REPLACEMENTS)
    void voidPending(@Param("identity") UUID identityId);

    /** The replacement code by id, identity and state. */
    Optional<CodeReplacementEntity> findByIdAndIdentityIdAndState(UUID id, UUID identityId, String state);
}
