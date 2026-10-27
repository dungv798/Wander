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

/** Spring Data JPA repository của bảng yêu cầu ghép thiết bị. */
public interface DeviceLinkJpaRepository extends JpaRepository<DeviceLinkEntity, UUID> {

    /** Có yêu cầu ghép nào đang giữ băm bí mật này ở trạng thái đã cho. */
    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);

    /** Mã ghép đang được một yêu cầu ở trạng thái đã cho còn hạn dùng. */
    boolean existsByPairingCodeAndStateAndExpiresAtAfter(String pairingCode, String state, Instant now);

    /** Yêu cầu ghép còn chờ và còn hạn theo mã ghép, với khóa ghi (SELECT … FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.ACTIVE_LINK_BY_PAIRING_CODE)
    List<DeviceLinkEntity> lockActiveByPairingCode(@Param("code") String code, @Param("now") Instant now);
}
