package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.constant.IdentityQueryConstants;
import com.wander.identity.infrastructure.persistence.entity.CodeReplacementEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Spring Data JPA repository của bảng mã thay thế. */
public interface CodeReplacementJpaRepository extends JpaRepository<CodeReplacementEntity, UUID> {

    /** Hủy mọi mã thay thế đang chờ của danh tính; flush trước và làm sạch bộ nhớ đệm sau để truy vấn kế tiếp thấy kết quả. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(IdentityQueryConstants.VOID_PENDING_REPLACEMENTS)
    void voidPending(@Param("identity") UUID identityId);

    /** Mã thay thế theo id, danh tính và trạng thái. */
    Optional<CodeReplacementEntity> findByIdAndIdentityIdAndState(UUID id, UUID identityId, String state);
}
