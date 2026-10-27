package com.wander.planning.infrastructure.persistence.repository;

import com.wander.planning.infrastructure.persistence.constant.PlanningQueryConstants;
import com.wander.planning.infrastructure.persistence.entity.OwnerPreferencesEntity;
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng sở thích theo danh tính. */
public interface OwnerPreferencesJpaRepository extends JpaRepository<OwnerPreferencesEntity, UUID> {

    /** Ghi hoặc thay sở thích của chủ bằng MỘT câu SQL nguyên tử (hai thiết bị cùng đặt lần đầu không vi phạm khóa chính). */
    @Modifying
    @Query(value = PlanningQueryConstants.UPSERT_OWNER_INTERESTS, nativeQuery = true)
    void upsert(@Param("owner") UUID owner, @Param("interests") String interests, @Param("now") Instant now);
}
