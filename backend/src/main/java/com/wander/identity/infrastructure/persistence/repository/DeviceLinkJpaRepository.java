package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.DeviceLinkEntity;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository of the device-pairing request table. */
public interface DeviceLinkJpaRepository extends JpaRepository<DeviceLinkEntity, UUID> {

    /** Whether a pairing request holds this secret hash in the given state. */
    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);

    /** The pairing code is in use by a request in the given state that has not expired. */
    boolean existsByPairingCodeAndStateAndExpiresAtAfter(String pairingCode, String state, Instant now);

    /** The pairing request that is pending and not expired, by pairing code, read WITHOUT a lock (a preview only reads, so it does not block other calls). */
    @Query(IdentityQueryConstants.ACTIVE_LINK_BY_PAIRING_CODE)
    List<DeviceLinkEntity> findActiveByPairingCode(@Param("code") String code, @Param("now") Instant now);

    /** The pairing request that is pending and not expired, by pairing code, with a write lock (SELECT ... FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.ACTIVE_LINK_BY_PAIRING_CODE)
    List<DeviceLinkEntity> lockActiveByPairingCode(@Param("code") String code, @Param("now") Instant now);
}
