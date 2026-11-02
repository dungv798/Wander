package com.wander.rating.infrastructure.persistence.repository;

import com.wander.rating.infrastructure.persistence.entity.RatingReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/** Spring Data JPA repository của báo cáo lời bình (dùng cho truy vấn đếm trong JPQL). */
public interface RatingReportJpaRepository extends JpaRepository<RatingReportEntity, Long> {
}
