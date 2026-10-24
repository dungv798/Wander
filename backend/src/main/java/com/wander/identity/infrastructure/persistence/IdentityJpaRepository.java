package com.wander.identity.infrastructure.persistence;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository (truy vấn suy diễn từ tên, @Query JPQL, @Lock = SELECT … FOR UPDATE). */
public interface IdentityJpaRepository extends JpaRepository<IdentityEntity, UUID> {
}
