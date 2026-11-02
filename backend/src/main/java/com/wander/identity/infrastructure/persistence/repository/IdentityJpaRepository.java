package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.IdentityEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository (truy vấn suy diễn từ tên, @Query JPQL, @Lock = SELECT … FOR UPDATE). */
public interface IdentityJpaRepository extends JpaRepository<IdentityEntity, UUID> {

    /** Khóa danh tính trước mọi thay đổi mã để recovery và tái tạo không ghi đè nhau. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(IdentityQueryConstants.IDENTITY_BY_ID)
    Optional<IdentityEntity> lockById(@Param("id") UUID id);
}
