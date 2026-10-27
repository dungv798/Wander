package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.IdentityEventEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của nhật ký sự kiện bảo mật. */
public interface IdentityEventJpaRepository extends JpaRepository<IdentityEventEntity, Long> {

    /** Sự kiện của danh tính, mới nhất trước (theo khóa tự tăng), giới hạn theo trang. */
    List<IdentityEventEntity> findByIdentityIdOrderByIdDesc(UUID identityId, Pageable page);

    /** Xóa các sự kiện cũ vượt quá {@code keep} sự kiện mới nhất của danh tính. */
    @Modifying
    @Query(value = IdentityQueryConstants.PRUNE_EVENTS, nativeQuery = true)
    void pruneOlderThan(@Param("identity") UUID identity, @Param("keep") int keep);

    /** Có sự kiện thêm thiết bị mới hơn lần xem gần nhất không. */
    @Query(value = IdentityQueryConstants.HAS_UNSEEN_ALERT, nativeQuery = true)
    boolean hasUnseenAlert(@Param("identity") UUID identity);

    /** Ghi mốc "đã xem" của danh tính. */
    @Modifying
    @Query(value = IdentityQueryConstants.MARK_EVENTS_SEEN, nativeQuery = true)
    void markSeen(@Param("identity") UUID identity);
}
