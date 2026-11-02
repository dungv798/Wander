package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryCodeEntity;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng mã khôi phục. */
public interface RecoveryCodeJpaRepository extends JpaRepository<RecoveryCodeEntity, UUID> {

    /** Metadata không bí mật của những khóa chưa được phép bỏ khỏi cấu hình deploy. */
    @Query(value = IdentityQueryConstants.REQUIRED_RECOVERY_KEY_VERSIONS, nativeQuery = true)
    List<String> findRequiredKeyVersions();

    /** Mã còn hợp lệ theo băm. */
    Optional<RecoveryCodeEntity> findByCodeHashAndInvalidatedAtIsNull(String codeHash);

    /** Mã còn hợp lệ của danh tính. */
    Optional<RecoveryCodeEntity> findByIdentityIdAndInvalidatedAtIsNull(UUID identityId);

    /** Mã theo id với khóa ghi (SELECT … FOR UPDATE). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.RECOVERY_CODE_BY_ID)
    Optional<RecoveryCodeEntity> lockById(@Param("id") UUID id);
}
