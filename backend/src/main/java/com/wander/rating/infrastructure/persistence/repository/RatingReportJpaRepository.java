package com.wander.rating.infrastructure.persistence.repository;

import com.wander.rating.infrastructure.persistence.entity.RatingReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository of the comment reports (used for the counting query in JPQL). */
public interface RatingReportJpaRepository extends JpaRepository<RatingReportEntity, Long> {
}
