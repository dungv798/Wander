package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.StepUpRequestEntity;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng yêu cầu xác thực lại. */
public interface StepUpJpaRepository extends JpaRepository<StepUpRequestEntity, UUID> {

    /** Yêu cầu có thể duyệt: đúng mã, đúng danh tính, đang chờ, còn hạn và do một phiên KHÁC xin. */
    @Query(IdentityQueryConstants.APPROVABLE_STEP_UP)
    List<StepUpRequestEntity> findApprovable(@Param("code") String code, @Param("identity") UUID identity,
                                             @Param("session") UUID notSession, @Param("now") Instant now);

    /** Như {@link #findApprovable} nhưng khóa ghi (SELECT … FOR UPDATE): duyệt/từ chối đồng thời chỉ một lượt thắng. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.APPROVABLE_STEP_UP)
    List<StepUpRequestEntity> lockApprovable(@Param("code") String code, @Param("identity") UUID identity,
                                             @Param("session") UUID notSession, @Param("now") Instant now);

    /** Yêu cầu đã được duyệt và dùng được cho đúng phiên, đúng thao tác, còn hạn; khóa ghi để dùng đúng một lần. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.USABLE_STEP_UP)
    Optional<StepUpRequestEntity> findUsable(@Param("id") UUID id, @Param("identity") UUID identity,
                                             @Param("session") UUID session, @Param("op") String op,
                                             @Param("now") Instant now);
}
