package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.IdentityEventEntity;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the security event log. */
public interface IdentityEventJpaRepository extends JpaRepository<IdentityEventEntity, Long> {

    /** The identity's events, newest first (by the auto-increment key), limited by page. */
    List<IdentityEventEntity> findByIdentityIdOrderByIdDesc(UUID identityId, Pageable page);

    /** Inserts the event unless an event with the same id is already recorded; returns the rows inserted (0 = duplicate delivery). */
    @Modifying
    @Query(value = IdentityQueryConstants.INSERT_EVENT_IF_ABSENT, nativeQuery = true)
    int insertIfAbsent(@Param("eventId") UUID eventId, @Param("identity") UUID identity, @Param("kind") String kind,
                       @Param("deviceName") String deviceName, @Param("occurredAt") Instant occurredAt);

    /** Deletes the identity's events beyond the {@code keep} newest ones. */
    @Modifying
    @Query(value = IdentityQueryConstants.PRUNE_EVENTS, nativeQuery = true)
    void pruneOlderThan(@Param("identity") UUID identity, @Param("keep") int keep);

    /** Whether there is a device-added event newer than the last time it was viewed. */
    @Query(value = IdentityQueryConstants.HAS_UNSEEN_ALERT, nativeQuery = true)
    boolean hasUnseenAlert(@Param("identity") UUID identity);

    /** Records the identity's 'seen' mark. */
    @Modifying
    @Query(value = IdentityQueryConstants.MARK_EVENTS_SEEN, nativeQuery = true)
    void markSeen(@Param("identity") UUID identity);
}
