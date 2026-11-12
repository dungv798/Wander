package com.wander.planning.infrastructure.persistence.repository;

import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.OwnerPreferencesEntity;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the preferences-by-identity table. */
public interface OwnerPreferencesJpaRepository extends JpaRepository<OwnerPreferencesEntity, UUID> {

    /** Writes or replaces the owner's preferences with ONE atomic SQL statement (two devices setting for the first time do not violate the primary key). */
    @Modifying
    @Query(value = PlanningQueryConstants.UPSERT_OWNER_INTERESTS, nativeQuery = true)
    void upsert(@Param("owner") UUID owner, @Param("interests") String interests, @Param("now") Instant now);
}
