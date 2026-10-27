package com.wander.identity.infrastructure.persistence.repository;

import com.wander.identity.infrastructure.persistence.entity.IdentityEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository (truy vấn suy diễn từ tên, @Query JPQL, @Lock = SELECT … FOR UPDATE). */
public interface IdentityJpaRepository extends JpaRepository<IdentityEntity, UUID> {
}
