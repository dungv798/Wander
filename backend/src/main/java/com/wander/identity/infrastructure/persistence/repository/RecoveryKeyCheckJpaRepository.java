package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.RecoveryKeyCheckEntity;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng dấu vân tay khóa khôi phục (khóa chính là nhãn khóa). */
public interface RecoveryKeyCheckJpaRepository extends JpaRepository<RecoveryKeyCheckEntity, String> {

    /** Ghi dấu vân tay nếu nhãn chưa có (an toàn khi hai instance khởi động cùng lúc); trả số dòng đã ghi, 0 nghĩa là đã có. */
    @Modifying(clearAutomatically = true)
    @Query(value = IdentityQueryConstants.INSERT_KEY_CHECK_IF_ABSENT, nativeQuery = true)
    int insertIfAbsent(@Param("version") String version, @Param("fingerprint") String fingerprint, @Param("now") Instant now);
}
