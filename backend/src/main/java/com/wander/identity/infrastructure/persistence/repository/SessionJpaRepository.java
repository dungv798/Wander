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

/** Spring Data JPA repository của bảng phiên. */
public interface SessionJpaRepository extends JpaRepository<SessionEntity, UUID> {

    /** Phiên theo băm bí mật. */
    Optional<SessionEntity> findByTokenHash(String tokenHash);

    /** Băm bí mật đã thuộc về một phiên nào đó (kể cả đã thu hồi). */
    boolean existsByTokenHash(String tokenHash);

    /** Các phiên chưa bị thu hồi của danh tính. */
    List<SessionEntity> findByIdentityIdAndRevokedAtIsNull(UUID identityId);

    /** Phiên chưa bị thu hồi theo mã, của đúng danh tính. */
    Optional<SessionEntity> findByIdAndIdentityIdAndRevokedAtIsNull(UUID id, UUID identityId);

    /** Ghi thời điểm phiên được dùng gần nhất. */
    @Modifying
    @Query(IdentityQueryConstants.TOUCH_SESSION)
    void touch(@Param("id") UUID id, @Param("now") Instant now);

    /** Đặt hoặc xóa tên thiết bị của phiên chưa bị thu hồi. */
    @Modifying
    @Query(IdentityQueryConstants.RENAME_SESSION)
    void rename(@Param("id") UUID id, @Param("name") String name);

    /** Thu hồi phiên nếu chưa bị thu hồi. */
    @Modifying
    @Query(IdentityQueryConstants.REVOKE_SESSION)
    void revoke(@Param("id") UUID id, @Param("now") Instant now);
}
