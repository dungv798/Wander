package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryAttemptEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng lần thử khôi phục. */
public interface RecoveryAttemptJpaRepository extends JpaRepository<RecoveryAttemptEntity, UUID> {

    /** Lần thử theo mã nhận diện với khóa ghi (SELECT … FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.ATTEMPT_BY_KEY)
    Optional<RecoveryAttemptEntity> lockByAttemptKey(@Param("key") String key);

    /** Có lần thử nào đang giữ băm bí mật này ở trạng thái đã cho. */
    boolean existsBySessionTokenHashAndState(String sessionTokenHash, String state);
}
