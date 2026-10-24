package com.wander.identity.infrastructure.persistence;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeviceLinkJpaRepository extends JpaRepository<DeviceLinkEntity, UUID> {
    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);

    boolean existsByPairingCodeAndStateAndExpiresAtAfter(String pairingCode, String state, Instant now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from DeviceLinkEntity d where d.pairingCode = :code and d.state = 'pending' and d.expiresAt > :now")
    List<DeviceLinkEntity> lockActiveByPairingCode(@Param("code") String code, @Param("now") Instant now);
}
